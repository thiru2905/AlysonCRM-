import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import type { ToolCallResult } from "../types";
import { recordConnectionSent, updateProspectLinkedInConnectionState } from "./browser-workers";
import { createMessageDraft } from "./linkedin-outreach";
import { missionContextForRun } from "./mission-profiles";

type ProspectInput = {
  name: string;
  profileUrl: string;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  status?: string;
  runId?: string;
  source?: string;
  missionName?: string;
  missionId?: string;
  audience?: string;
};

function normalizeProfileUrl(url: string): string {
  return url.split("?")[0]?.replace(/\/$/, "") ?? url;
}

function buildMetadata(input: ProspectInput): string {
  const meta: Record<string, string> = {};
  if (input.runId) meta.runId = input.runId;
  if (input.source) meta.source = input.source;
  if (input.missionName) meta.missionName = input.missionName;
  if (input.missionId) meta.missionId = input.missionId;
  if (input.audience) meta.audience = input.audience;
  return JSON.stringify(meta);
}

function mergeMetadata(existingJson: string | null, input: ProspectInput): string {
  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(existingJson || "{}") as Record<string, string>;
  } catch {
    existing = {};
  }
  if (input.runId) existing.runId = input.runId;
  if (input.source) existing.source = input.source;
  if (input.missionName) existing.missionName = input.missionName;
  if (input.missionId) existing.missionId = input.missionId;
  if (input.audience) existing.audience = input.audience;
  return JSON.stringify(existing);
}

function missionNameForRun(runId?: string): string | undefined {
  if (!runId) return undefined;
  const db = getAgentDb();
  const row = db
    .prepare(`SELECT name FROM hermes_missions WHERE automation_run_id = ? LIMIT 1`)
    .get(runId) as { name: string } | undefined;
  return row?.name;
}

export function upsertProspect(input: ProspectInput): string {
  const db = getAgentDb();
  const now = nowIso();
  const profileUrl = normalizeProfileUrl(input.profileUrl);
  const missionName = input.missionName ?? missionNameForRun(input.runId);
  const missionCtx = missionContextForRun(input.runId);
  const enriched = {
    ...input,
    missionName: missionName ?? missionCtx.missionName,
    missionId: input.missionId ?? missionCtx.missionId,
    audience: input.audience ?? missionCtx.audience,
    source: input.source ?? (input.runId ? "hermes" : undefined),
  };

  const existing = db
    .prepare(`SELECT id, status, metadata_json FROM linkedin_prospects WHERE profile_url = ? LIMIT 1`)
    .get(profileUrl) as { id: string; status: string; metadata_json: string | null } | undefined;

  if (existing) {
    const nextStatus = pickStatus(existing.status, enriched.status ?? "new");
    db.prepare(
      `UPDATE linkedin_prospects
       SET name = ?, company = COALESCE(?, company), title = COALESCE(?, title),
           location = COALESCE(?, location), status = ?, last_action_at = ?,
           metadata_json = ?
       WHERE id = ?`
    ).run(
      enriched.name,
      enriched.company ?? null,
      enriched.title ?? null,
      enriched.location ?? null,
      nextStatus,
      now,
      mergeMetadata(existing.metadata_json, enriched),
      existing.id
    );
    return existing.id;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO linkedin_prospects
     (id, campaign_id, name, profile_url, company, title, location, status, last_action_at, metadata_json, created_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    enriched.name,
    profileUrl,
    enriched.company ?? null,
    enriched.title ?? null,
    enriched.location ?? null,
    enriched.status ?? "new",
    now,
    buildMetadata(enriched),
    now
  );
  return id;
}

function pickStatus(current: string, incoming: string): string {
  const rank: Record<string, number> = {
    new: 0,
    pending_approval: 1,
    draft_saved: 2,
    connection_sent: 3,
    invite_pending: 3,
    connected: 4,
    messaged: 4,
    replied: 5,
  };
  return (rank[incoming] ?? 0) >= (rank[current] ?? 0) ? incoming : current;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function saveProfileFields(
  fields: Record<string, unknown>,
  status: string,
  runId?: string
): string | null {
  const profileUrl = String(fields.profileUrl ?? fields.profile_url ?? "").trim();
  const name = String(fields.name ?? "").trim();
  if (!profileUrl || !name) return null;

  const prospectId = upsertProspect({
    name,
    profileUrl,
    company: fields.company ? String(fields.company) : null,
    title: fields.title ? String(fields.title) : null,
    location: fields.location ? String(fields.location) : null,
    status,
    runId,
  });

  const draft = fields.draft ?? fields.message;
  if (typeof draft === "string" && draft.trim()) {
    createMessageDraft(prospectId, draft.trim());
  }

  return prospectId;
}

export function syncProspectsFromToolResult(
  tool: string,
  result: ToolCallResult,
  runId?: string
): number {
  if (!tool.startsWith("linkedin.")) return 0;

  const data = asRecord(result.data);
  let saved = 0;

  if (tool === "linkedin.search_people" && Array.isArray(data.profiles)) {
    for (const raw of data.profiles) {
      const profile = asRecord(raw);
      if (saveProfileFields(profile, "new", runId)) saved += 1;
    }
    return saved;
  }

  if (tool === "linkedin.extract_search_profiles" && Array.isArray(data.profiles)) {
    for (const raw of data.profiles) {
      const profile = asRecord(raw);
      if (saveProfileFields(profile, "new", runId)) saved += 1;
    }
    return saved;
  }

  if (tool === "linkedin.connect_from_search" && result.status === "pending_approval") {
    if (saveProfileFields(data, "pending_approval", runId)) saved += 1;
    return saved;
  }

  if (tool === "linkedin.extract_profile" || tool === "linkedin.open_profile") {
    if (saveProfileFields(data, "new", runId)) saved += 1;
    return saved;
  }

  if (tool === "linkedin.send_connection_request" || tool === "linkedin.send_message" || tool === "linkedin.connect_from_search") {
    const profileUrl = normalizeProfileUrl(String(data.profileUrl ?? ""));
    let name = String(data.name ?? "").trim();
    if (!profileUrl) return 0;

    if (!name || /^unknown$/i.test(name)) {
      const db = getAgentDb();
      const existing = db
        .prepare(`SELECT name FROM linkedin_prospects WHERE profile_url = ? LIMIT 1`)
        .get(profileUrl) as { name: string } | undefined;
      if (existing?.name) name = existing.name;
    }
    if (!name) return 0;

    if (result.status === "success" && (data.status === "connection_sent" || data.status === "connect_clicked")) {
      recordConnectionSent({
        name,
        profileUrl,
        company: data.company ? String(data.company) : undefined,
        title: data.title ? String(data.title) : undefined,
        runId,
        missionName: missionNameForRun(runId),
      });
      return 1;
    }

    const status =
      result.status === "pending_approval"
        ? "pending_approval"
        : data.status === "draft_saved"
          ? "draft_saved"
          : "new";

    if (saveProfileFields(data, status, runId)) saved += 1;
    return saved;
  }

  if (tool === "linkedin.check_connection") {
    const profileUrl = String(data.profileUrl ?? "").trim();
    const state = String(data.status ?? "unknown");
    if (profileUrl) {
      updateProspectLinkedInConnectionState({
        profileUrl,
        linkedinState:
          state === "connected"
            ? "connected"
            : state === "pending"
              ? "pending"
              : state === "none"
                ? "none"
                : "unknown",
        name: data.name ? String(data.name) : undefined,
      });
      return 1;
    }
    return 0;
  }

  if (tool === "linkedin.create_reply_draft") {
    const draft = typeof data.draft === "string" ? data.draft : null;
    if (draft && runId) {
      const fromRun = findLatestProspectForRun(runId);
      if (fromRun) {
        createMessageDraft(fromRun, draft);
        upsertProspect({ ...fromRun, status: "draft_saved", runId });
        return 1;
      }
    }
  }

  return saved;
}

function findLatestProspectForRun(runId: string): ProspectInput | null {
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT p.name, p.profile_url as profileUrl, p.company, p.title, p.location
       FROM linkedin_prospects p
       INNER JOIN linkedin_actions a ON a.prospect_id = p.id
       WHERE a.payload_json LIKE ?
       ORDER BY p.created_at DESC
       LIMIT 1`
    )
    .get(`%${runId}%`) as ProspectInput | undefined;

  if (row) return row;

  const latest = db
    .prepare(
      `SELECT name, profile_url as profileUrl, company, title, location
       FROM linkedin_prospects ORDER BY created_at DESC LIMIT 1`
    )
    .get() as ProspectInput | undefined;

  return latest ?? null;
}

export function syncProspectsFromApprovalPayload(
  payload: Record<string, unknown>,
  runId?: string
): number {
  const nested = asRecord(payload.payload ?? payload);
  const status = "pending_approval";
  let saved = 0;

  if (saveProfileFields(nested, status, runId)) saved += 1;

  if (Array.isArray(nested.profiles)) {
    for (const raw of nested.profiles) {
      if (saveProfileFields(asRecord(raw), "new", runId)) saved += 1;
    }
  }

  return saved;
}

export function backfillProspectsFromToolCalls(): number {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT run_id as runId, tool, result_json as resultJson
       FROM tool_calls WHERE tool LIKE 'linkedin.%' ORDER BY created_at ASC`
    )
    .all() as Array<{ runId: string; tool: string; resultJson: string }>;

  let saved = 0;
  for (const row of rows) {
    try {
      const result = JSON.parse(row.resultJson) as ToolCallResult;
      saved += syncProspectsFromToolResult(row.tool, result, row.runId);
    } catch {
      // skip malformed rows
    }
  }
  return saved;
}
