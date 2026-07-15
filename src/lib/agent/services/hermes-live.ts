import { getAgentDb } from "../db/client";
import { isLinkedInOutreachEnabled } from "../linkedin/safety";
import { listToolCalls } from "./browser-workers";
import { getAutomationRun } from "./automation";
import { getHermesMission, listHermesMissionsSynced } from "./hermes-engine";
import type { HermesMissionRecord } from "@/lib/hermes/types";

export interface HermesConnectionRecord {
  prospectId: string;
  name: string;
  profileUrl: string;
  company: string | null;
  title: string | null;
  status: string;
  missionId: string | null;
  missionName: string | null;
  runId: string | null;
  lastActionAt: string | null;
}

export interface HermesLiveStatus {
  updatedAt: string;
  outreachEnabled: boolean;
  maxConnectionsPerDay: number;
  activeMission: HermesMissionRecord | null;
  runStatus: string | null;
  targetCount: number;
  browserActions: number;
  connectionsPrepared: number;
  connectionsSent: number;
  pendingApprovals: number;
  lastTool: string | null;
  lastToolAt: string | null;
  phase: string;
  message: string;
  recentConnections: HermesConnectionRecord[];
}


export function listHermesConnections(limit = 50, runId?: string): HermesConnectionRecord[] {
  const db = getAgentDb();
  const rows = runId
    ? db
        .prepare(
          `SELECT p.id as prospectId, p.name, p.profile_url as profileUrl, p.company, p.title,
                  p.status, p.last_action_at as lastActionAt, p.metadata_json,
                  h.id as missionId, h.name as missionName
           FROM linkedin_prospects p
           LEFT JOIN hermes_missions h ON h.automation_run_id = json_extract(p.metadata_json, '$.runId')
           WHERE json_extract(p.metadata_json, '$.source') = 'hermes'
             AND json_extract(p.metadata_json, '$.runId') = ?
           ORDER BY COALESCE(p.last_action_at, p.created_at) DESC
           LIMIT ?`
        )
        .all(runId, limit)
    : db
        .prepare(
          `SELECT p.id as prospectId, p.name, p.profile_url as profileUrl, p.company, p.title,
                  p.status, p.last_action_at as lastActionAt, p.metadata_json,
                  h.id as missionId, h.name as missionName
           FROM linkedin_prospects p
           LEFT JOIN hermes_missions h ON h.automation_run_id = json_extract(p.metadata_json, '$.runId')
           WHERE json_extract(p.metadata_json, '$.source') = 'hermes'
           ORDER BY COALESCE(p.last_action_at, p.created_at) DESC
           LIMIT ?`
        )
        .all(limit);

  return (rows as Array<{
    prospectId: string;
    name: string;
    profileUrl: string;
    company: string | null;
    title: string | null;
    status: string;
    lastActionAt: string | null;
    metadata_json: string;
    missionId: string | null;
    missionName: string | null;
  }>).map((r) => {
    let runIdFromMeta: string | null = null;
    try {
      runIdFromMeta = JSON.parse(r.metadata_json || "{}").runId ?? null;
    } catch {
      runIdFromMeta = null;
    }
    return {
      prospectId: r.prospectId,
      name: r.name,
      profileUrl: r.profileUrl,
      company: r.company,
      title: r.title,
      status: r.status,
      missionId: r.missionId,
      missionName: r.missionName,
      runId: runIdFromMeta,
      lastActionAt: r.lastActionAt,
    };
  });
}

function derivePhase(input: {
  mission: HermesMissionRecord | null;
  runStatus: string | null;
  runError: string | null;
  browserActions: number;
  connectionsPrepared: number;
  connectionsSent: number;
  targetCount: number;
  pendingApprovals: number;
  lastTool: string | null;
}): { phase: string; message: string } {
  const { mission, runStatus, browserActions, connectionsPrepared, connectionsSent, targetCount, pendingApprovals, lastTool } =
    input;

  if (!mission) {
    return { phase: "idle", message: "No active Hermes mission. Launch one below to start outreach." };
  }

  if (mission.status === "failed" || runStatus === "failed") {
    return {
      phase: "failed",
      message:
        mission.error ??
        run?.error ??
        "Mission failed. Restart Desktop Agent (Start-Alyson.bat) and launch a new mission.",
    };
  }

  if (mission.status === "completed" || runStatus === "completed") {
    return {
      phase: "completed",
      message: `Mission complete — ${connectionsSent} sent, ${connectionsPrepared} prepared of ${targetCount} target.`,
    };
  }

  if (pendingApprovals > 0) {
    return {
      phase: "approval",
      message: `${pendingApprovals} connection draft(s) waiting for your approval below.`,
    };
  }

  if (browserActions === 0) {
    return {
      phase: "starting",
      message: "Starting desktop agent and Chrome… first launch can take up to 60 seconds.",
    };
  }

  if (lastTool?.includes("launch") || lastTool?.includes("check_login")) {
    return { phase: "chrome", message: "Opening Alyson Chrome and checking LinkedIn login…" };
  }

  if (lastTool?.includes("search") || lastTool?.includes("navigate")) {
    return {
      phase: "search",
      message: `Searching LinkedIn for: ${mission.config.audience}`,
    };
  }

  if (lastTool?.includes("extract") || lastTool?.includes("open_profile")) {
    return {
      phase: "profiles",
      message: `Reviewing profiles — ${connectionsPrepared}/${targetCount} connection requests prepared.`,
    };
  }

  if (lastTool?.includes("send_connection")) {
    return {
      phase: "connect",
      message: `Connection requests — ${connectionsSent} sent, ${connectionsPrepared} prepared of ${targetCount}.`,
    };
  }

  return {
    phase: "running",
    message: `Hermes is running — ${browserActions} browser actions so far.`,
  };
}

export function getHermesLiveStatus(): HermesLiveStatus {
  const db = getAgentDb();
  const missions = listHermesMissionsSynced(10);
  const activeMission =
    missions.find((m) =>
      ["running", "queued", "awaiting_approval"].includes(m.status)
    ) ?? null;

  const runId = activeMission?.automationRunId ?? null;
  const run = runId ? getAutomationRun(runId) : null;
  const toolCalls = runId ? listToolCalls(100, runId) : [];
  const lastTool = toolCalls[0] ?? null;

  const targetCount = activeMission?.config.count ?? 0;

  let connectionsPrepared = 0;
  let connectionsSent = 0;
  if (runId) {
    const counts = db
      .prepare(
        `SELECT status, COUNT(*) as c FROM linkedin_prospects
         WHERE json_extract(metadata_json, '$.runId') = ?
         GROUP BY status`
      )
      .all(runId) as Array<{ status: string; c: number }>;
    for (const row of counts) {
      if (row.status === "connection_sent") connectionsSent += row.c;
      if (["pending_approval", "draft_saved", "connection_sent", "invite_pending"].includes(row.status)) {
        connectionsPrepared += row.c;
      }
    }
  }

  const pendingApprovals = runId
    ? ((db
        .prepare(`SELECT COUNT(*) as c FROM approval_requests WHERE run_id = ? AND status = 'pending'`)
        .get(runId) as { c: number }).c ?? 0)
    : 0;

  const outreachEnabled = isLinkedInOutreachEnabled();
  const maxConnectionsPerDay = Number(process.env.LINKEDIN_MAX_CONNECTIONS_PER_DAY ?? "10");

  const { phase, message } = derivePhase({
    mission: activeMission,
    runStatus: run?.status ?? null,
    runError: run?.error ?? null,
    browserActions: toolCalls.length,
    connectionsPrepared,
    connectionsSent,
    targetCount,
    pendingApprovals,
    lastTool: lastTool?.tool ?? null,
  });

  return {
    updatedAt: new Date().toISOString(),
    outreachEnabled,
    maxConnectionsPerDay,
    activeMission,
    runStatus: run?.status ?? null,
    targetCount,
    browserActions: toolCalls.length,
    connectionsPrepared,
    connectionsSent,
    pendingApprovals,
    lastTool: lastTool?.tool ?? null,
    lastToolAt: lastTool?.createdAt ?? null,
    phase,
    message,
    recentConnections: listHermesConnections(8, runId ?? undefined),
  };
}
