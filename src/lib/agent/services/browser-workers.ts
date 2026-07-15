import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import {
  inviteStatusFromProspect,
  requestWasSent,
} from "../connection-status";
import { isDisplayableProspect } from "./prospect-filter";

export interface ToolCallRecord {
  id: string;
  runId: string;
  tool: string;
  status: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  screenshot?: string | null;
  createdAt: string;
}

export interface ConnectionRecord {
  prospectId: string;
  name: string;
  profileUrl: string;
  company: string | null;
  title: string | null;
  connectionStatus: string;
  inviteStatus: string;
  requestSent: boolean;
  sentAt: string | null;
  acceptedAt: string | null;
  lastCheckedAt: string | null;
  lastActionAt: string | null;
  runId: string | null;
  missionName: string | null;
  source: string | null;
}

export function listToolCalls(limit = 50, runId?: string): ToolCallRecord[] {
  const db = getAgentDb();
  const rows = runId
    ? db
        .prepare(
          `SELECT id, run_id as runId, tool, status, args_json, result_json, screenshot, created_at as createdAt
           FROM tool_calls WHERE run_id = ? ORDER BY created_at DESC LIMIT ?`
        )
        .all(runId, limit)
    : db
        .prepare(
          `SELECT id, run_id as runId, tool, status, args_json, result_json, screenshot, created_at as createdAt
           FROM tool_calls ORDER BY created_at DESC LIMIT ?`
        )
        .all(limit);
  return (rows as Array<{
    id: string;
    runId: string;
    tool: string;
    status: string;
    args_json: string;
    result_json: string;
    screenshot: string | null;
    createdAt: string;
  }>).map((r) => ({
    id: r.id,
    runId: r.runId,
    tool: r.tool,
    status: r.status,
    args: JSON.parse(r.args_json) as Record<string, unknown>,
    result: JSON.parse(r.result_json) as Record<string, unknown>,
    screenshot: r.screenshot,
    createdAt: r.createdAt,
  }));
}

export function getApprovalStatusForRun(
  runId: string,
  tool?: string,
  profileUrl?: string
): "pending" | "approved" | "rejected" | "none" {
  const db = getAgentDb();
  const normalizedProfile = profileUrl?.split("?")[0].replace(/\/$/, "") ?? "";

  if (tool && normalizedProfile) {
    const row = db
      .prepare(
        `SELECT status FROM approval_requests
         WHERE run_id = ? AND status IN ('approved', 'rejected', 'pending')
           AND payload_json LIKE ?
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(runId, `%${normalizedProfile}%`) as { status: string } | undefined;
    if (row) {
      if (row.status === "edited") return "approved";
      return row.status as "pending" | "approved" | "rejected";
    }
  }

  const row = tool
    ? (db
        .prepare(
          `SELECT status FROM approval_requests
           WHERE run_id = ? AND (
             payload_json LIKE ? OR description LIKE ? OR title LIKE ?
           )
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(runId, `%${tool}%`, `%${tool}%`, `%${tool}%`) as { status: string } | undefined)
    : (db
        .prepare(
          `SELECT status FROM approval_requests WHERE run_id = ? ORDER BY created_at DESC LIMIT 1`
        )
        .get(runId) as { status: string } | undefined);
  if (!row) return "none";
  if (row.status === "edited") return "approved";
  return row.status as "pending" | "approved" | "rejected";
}

export function recordConnectionSent(input: {
  name: string;
  profileUrl: string;
  company?: string;
  title?: string;
  runId?: string;
  missionName?: string;
}): string {
  const db = getAgentDb();
  const now = nowIso();
  const profileUrl = input.profileUrl.split("?")[0]?.replace(/\/$/, "") ?? input.profileUrl;
  const metadata = JSON.stringify({
    runId: input.runId ?? null,
    source: "hermes",
    missionName: input.missionName ?? null,
    sentAt: now,
    linkedinConnectionState: "pending",
  });
  let prospectId = (
    db
      .prepare(`SELECT id FROM linkedin_prospects WHERE profile_url = ? LIMIT 1`)
      .get(profileUrl) as { id: string } | undefined
  )?.id;

  if (!prospectId) {
    prospectId = uuidv4();
    db.prepare(
      `INSERT INTO linkedin_prospects (id, name, profile_url, company, title, status, last_action_at, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, 'invite_pending', ?, ?, ?)`
    ).run(
      prospectId,
      input.name,
      input.profileUrl,
      input.company ?? null,
      input.title ?? null,
      now,
      metadata,
      now
    );
  } else {
    db.prepare(
      `UPDATE linkedin_prospects SET status = 'invite_pending', last_action_at = ?, metadata_json = ? WHERE id = ?`
    ).run(now, metadata, prospectId);
  }

  const actionId = uuidv4();
  db.prepare(
    `INSERT INTO linkedin_actions (id, prospect_id, action_type, status, requires_approval, payload_json, created_at, completed_at)
     VALUES (?, ?, 'connection_request', 'sent', 1, ?, ?, ?)`
  ).run(
    actionId,
    prospectId,
    JSON.stringify({ runId: input.runId, sentAt: now }),
    now,
    now
  );

  return prospectId;
}

export function updateProspectLinkedInConnectionState(input: {
  profileUrl: string;
  linkedinState: "none" | "pending" | "connected" | "unknown";
  name?: string;
}): void {
  const db = getAgentDb();
  const now = nowIso();
  const row = db
    .prepare(`SELECT id, status, metadata_json FROM linkedin_prospects WHERE profile_url = ? LIMIT 1`)
    .get(input.profileUrl.split("?")[0].replace(/\/$/, "")) as
    | { id: string; status: string; metadata_json: string | null }
    | undefined;

  if (!row) return;

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(row.metadata_json || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }
  meta.linkedinConnectionState = input.linkedinState;
  meta.lastCheckedAt = now;

  let nextStatus = row.status;
  if (input.linkedinState === "connected") {
    nextStatus = "connected";
    meta.acceptedAt = meta.acceptedAt ?? now;
  } else if (input.linkedinState === "pending" && requestWasSent(inviteStatusFromProspect(row.status))) {
    nextStatus = "invite_pending";
  }

  db.prepare(
    `UPDATE linkedin_prospects SET status = ?, metadata_json = ?, last_action_at = ? WHERE id = ?`
  ).run(nextStatus, JSON.stringify(meta), now, row.id);
}

function parseConnectionMeta(metadata_json: string | null): {
  runId: string | null;
  source: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  lastCheckedAt: string | null;
} {
  try {
    const meta = JSON.parse(metadata_json || "{}") as Record<string, string | null>;
    return {
      runId: meta.runId ?? null,
      source: meta.source ?? null,
      sentAt: meta.sentAt ?? null,
      acceptedAt: meta.acceptedAt ?? null,
      lastCheckedAt: meta.lastCheckedAt ?? null,
    };
  } catch {
    return {
      runId: null,
      source: null,
      sentAt: null,
      acceptedAt: null,
      lastCheckedAt: null,
    };
  }
}

function enrichConnectionRow(r: {
  prospectId: string;
  name: string;
  profileUrl: string;
  company: string | null;
  title: string | null;
  connectionStatus: string;
  lastActionAt: string | null;
  metadata_json: string | null;
  missionName: string | null;
}): ConnectionRecord {
  const meta = parseConnectionMeta(r.metadata_json);
  const invite = inviteStatusFromProspect(r.connectionStatus);
  return {
    prospectId: r.prospectId,
    name: r.name,
    profileUrl: r.profileUrl,
    company: r.company,
    title: r.title,
    connectionStatus: r.connectionStatus,
    inviteStatus: invite,
    requestSent: invite === "sent_pending" || invite === "accepted",
    sentAt: meta.sentAt,
    acceptedAt: meta.acceptedAt,
    lastCheckedAt: meta.lastCheckedAt,
    lastActionAt: r.lastActionAt,
    runId: meta.runId,
    missionName: r.missionName,
    source: meta.source,
  };
}

export function listConnections(hermesOnly = false): ConnectionRecord[] {
  const db = getAgentDb();
  const where = hermesOnly
    ? `WHERE json_extract(p.metadata_json, '$.source') = 'hermes'
       AND p.status IN ('new', 'pending_approval', 'draft_saved', 'connection_sent', 'invite_pending', 'connected', 'messaged')`
    : `WHERE p.status != 'new'`;
  const rows = db
    .prepare(
      `SELECT p.id as prospectId, p.name, p.profile_url as profileUrl, p.company, p.title,
              p.status as connectionStatus, p.last_action_at as lastActionAt, p.metadata_json,
              h.name as missionName
       FROM linkedin_prospects p
       LEFT JOIN hermes_missions h ON h.automation_run_id = json_extract(p.metadata_json, '$.runId')
       ${where}
       ORDER BY COALESCE(p.last_action_at, p.created_at) DESC LIMIT 50`
    )
    .all();
  return (rows as Array<{
    prospectId: string;
    name: string;
    profileUrl: string;
    company: string | null;
    title: string | null;
    connectionStatus: string;
    lastActionAt: string | null;
    metadata_json: string | null;
    missionName: string | null;
  }>)
    .filter((r) =>
      isDisplayableProspect({
        name: r.name,
        profileUrl: r.profileUrl,
        status: r.connectionStatus,
        metadata_json: r.metadata_json,
        missionName: r.missionName,
      })
    )
    .map((r) => enrichConnectionRow(r));
}

export function getBrowserWorkersStats() {
  const db = getAgentDb();
  const runs = db
    .prepare(`SELECT status, COUNT(*) as c FROM automation_runs GROUP BY status`)
    .all() as Array<{ status: string; c: number }>;
  const toolCalls = (
    db.prepare(`SELECT COUNT(*) as c FROM tool_calls`).get() as { c: number }
  ).c;
  const connections = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM linkedin_prospects
         WHERE status IN ('connection_sent', 'invite_pending', 'connected')`
      )
      .get() as { c: number }
  ).c;
  const pending = (
    db
      .prepare(`SELECT COUNT(*) as c FROM approval_requests WHERE status = 'pending'`)
      .get() as { c: number }
  ).c;
  return {
    runsByStatus: Object.fromEntries(runs.map((r) => [r.status, r.c])),
    totalToolCalls: toolCalls,
    connectionsSent: connections,
    pendingApprovals: pending,
  };
}
