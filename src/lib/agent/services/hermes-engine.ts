import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import { isLinkedInOutreachEnabled } from "../linkedin/safety";
import { startAutomationWithPlan, getAutomationRun } from "./automation";
import { planHermesMission, isHermesDeepSeekConfigured } from "@/lib/hermes/hermes-planner.server";
import type {
  CreateHermesMissionInput,
  HermesEngineStatus,
  HermesMissionConfig,
  HermesMissionRecord,
  HermesMissionStatus,
} from "@/lib/hermes/types";

function parseMissionRow(row: {
  id: string;
  name: string;
  kind: string;
  config_json: string;
  status: string;
  automation_run_id: string | null;
  result_summary: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}): HermesMissionRecord {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as HermesMissionRecord["kind"],
    config: JSON.parse(row.config_json) as HermesMissionConfig,
    status: row.status as HermesMissionStatus,
    automationRunId: row.automation_run_id,
    resultSummary: row.result_summary,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function getHermesEngineStatus(): HermesEngineStatus {
  const outreachEnabled = isLinkedInOutreachEnabled();
  const maxConnectionsPerDay = Number(process.env.LINKEDIN_MAX_CONNECTIONS_PER_DAY ?? "10");
  const maxConnectionsPerMission = outreachEnabled
    ? Math.max(1, Math.min(maxConnectionsPerDay > 0 ? maxConnectionsPerDay : 10, 25))
    : 25;
  return {
    outreachEnabled,
    maxConnectionsPerDay,
    maxConnectionsPerMission,
    desktopAgentUrl:
      process.env.ALYSON_DESKTOP_AGENT_URL?.trim() ?? "http://127.0.0.1:8787",
    browserAgentUrl:
      process.env.ALYSON_BROWSER_AGENT_URL?.trim() ?? "http://127.0.0.1:8820",
    deepSeekConfigured: isHermesDeepSeekConfigured(),
    plannerSource: isHermesDeepSeekConfigured() ? "deepseek" : "heuristic",
  };
}

export function createHermesMission(input: CreateHermesMissionInput): HermesMissionRecord {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  const config: HermesMissionConfig = {
    ...input.config,
    count: Math.max(
      1,
      Math.min(input.config.count, getHermesEngineStatus().maxConnectionsPerMission)
    ),
  };

  db.prepare(
    `INSERT INTO hermes_missions
     (id, org_id, name, kind, config_json, status, created_at, updated_at)
     VALUES (?, 'org-default', ?, ?, ?, 'draft', ?, ?)`
  ).run(id, input.name.trim(), input.kind, JSON.stringify(config), now, now);

  db.prepare(
    `INSERT INTO automation_logs (run_id, level, message, created_at)
     VALUES (NULL, 'info', ?, ?)`
  ).run(`Hermes mission created: ${input.name}`, now);

  const saved = getHermesMission(id);
  if (!saved) {
    throw new Error(
      "Hermes mission could not be saved. Restart the dev server (npm run dev) and try again."
    );
  }
  return saved;
}

export function getHermesMission(id: string): HermesMissionRecord | null {
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT id, name, kind, config_json, status, automation_run_id, result_summary, error,
              created_at, updated_at, started_at, completed_at
       FROM hermes_missions WHERE id = ?`
    )
    .get(id) as Parameters<typeof parseMissionRow>[0] | undefined;
  if (!row) return null;
  return parseMissionRow(row);
}

export function listHermesMissions(limit = 40): HermesMissionRecord[] {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT id, name, kind, config_json, status, automation_run_id, result_summary, error,
              created_at, updated_at, started_at, completed_at
       FROM hermes_missions ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as Array<Parameters<typeof parseMissionRow>[0]>;
  return rows.map(parseMissionRow);
}

export function updateHermesMissionStatus(
  id: string,
  status: HermesMissionStatus,
  extra?: { automationRunId?: string; resultSummary?: string; error?: string }
): void {
  const db = getAgentDb();
  const now = nowIso();
  const startedAt =
    status === "running" || status === "queued" ? now : undefined;
  const completedAt =
    status === "completed" || status === "failed" || status === "cancelled"
      ? now
      : undefined;

  db.prepare(
    `UPDATE hermes_missions SET
       status = ?,
       automation_run_id = COALESCE(?, automation_run_id),
       result_summary = COALESCE(?, result_summary),
       error = COALESCE(?, error),
       started_at = COALESCE(?, started_at),
       completed_at = COALESCE(?, completed_at),
       updated_at = ?
     WHERE id = ?`
  ).run(
    status,
    extra?.automationRunId ?? null,
    extra?.resultSummary ?? null,
    extra?.error ?? null,
    startedAt ?? null,
    completedAt ?? null,
    now,
    id
  );
}

/** Sync mission status from linked automation run (called on read). */
export function syncHermesMissionFromRun(mission: HermesMissionRecord): HermesMissionRecord {
  if (!mission.automationRunId) return mission;
  const run = getAutomationRun(mission.automationRunId);
  if (!run) return mission;

  let nextStatus: HermesMissionStatus = mission.status;
  if (run.status === "running" || run.status === "planning") nextStatus = "running";
  if (run.status === "awaiting_approval") nextStatus = "awaiting_approval";
  if (run.status === "completed") nextStatus = "completed";
  if (run.status === "failed") nextStatus = "failed";
  if (run.status === "cancelled") nextStatus = "cancelled";

  if (
    nextStatus !== mission.status ||
    run.resultSummary !== mission.resultSummary ||
    run.error !== mission.error
  ) {
    updateHermesMissionStatus(mission.id, nextStatus, {
      resultSummary: run.resultSummary ?? undefined,
      error: run.error ?? undefined,
    });
    return getHermesMission(mission.id)!;
  }
  return mission;
}

export async function startHermesMission(
  missionId: string,
  deviceId?: string,
  existing?: HermesMissionRecord
): Promise<{ missionId: string; runId: string }> {
  const mission = existing ?? getHermesMission(missionId);
  if (!mission) {
    throw new Error(
      "Hermes mission not found. Restart the dev server (npm run dev) so the database migrates, then try again."
    );
  }
  if (mission.status === "running" || mission.status === "queued") {
    throw new Error("Mission is already running");
  }

  updateHermesMissionStatus(missionId, "queued");

  try {
    const { prompt, plan, source } = await planHermesMission({
      name: mission.name,
      kind: mission.kind,
      config: mission.config,
    });

    const db = getAgentDb();
    db.prepare(
      `INSERT INTO automation_logs (run_id, level, message, created_at)
       VALUES (NULL, 'info', ?, ?)`
    ).run(`Hermes plan (${source}): ${mission.name}`, nowIso());

    const runId = await startAutomationWithPlan(prompt, plan, deviceId);
    updateHermesMissionStatus(missionId, "running", { automationRunId: runId });
    return { missionId, runId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start mission";
    updateHermesMissionStatus(missionId, "failed", { error: message });
    throw err;
  }
}

export async function createAndStartHermesMission(
  input: CreateHermesMissionInput,
  deviceId?: string
): Promise<{ mission: HermesMissionRecord; runId: string }> {
  const mission = createHermesMission(input);
  const { runId } = await startHermesMission(mission.id, deviceId, mission);
  return { mission: getHermesMission(mission.id) ?? mission, runId };
}

export function listHermesMissionsSynced(limit = 40): HermesMissionRecord[] {
  return listHermesMissions(limit).map(syncHermesMissionFromRun);
}

export function getHermesMissionSynced(id: string): HermesMissionRecord | null {
  const mission = getHermesMission(id);
  if (!mission) return null;
  return syncHermesMissionFromRun(mission);
}
