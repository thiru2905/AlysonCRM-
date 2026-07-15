import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import { getAgentModelProvider } from "../model/provider";
import { classifyToolRisk, requiresApproval } from "../risk";
import type {
  AgentPlan,
  ApprovalRequestRecord,
  AutomationRunRecord,
  AutomationRunStatus,
  ToolCallResult,
} from "../types";

const DESKTOP_AGENT_URL =
  process.env.ALYSON_DESKTOP_AGENT_URL?.trim() ?? "http://127.0.0.1:8787";

function parsePlanJson(raw: string | null): AgentPlan | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as AgentPlan;
  } catch {
    return null;
  }
}

export function createAutomationRun(userPrompt: string, deviceId?: string): string {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(
    `INSERT INTO automation_runs (id, org_id, device_id, user_prompt, status, created_at, updated_at)
     VALUES (?, 'org-default', ?, ?, 'pending', ?, ?)`
  ).run(id, deviceId ?? null, userPrompt, now, now);
  db.prepare(
    `INSERT INTO automation_logs (run_id, device_id, level, message, created_at)
     VALUES (?, ?, 'info', ?, ?)`
  ).run(id, deviceId ?? null, `Run created: ${userPrompt.slice(0, 120)}`, now);
  return id;
}

export function getAutomationRun(id: string): AutomationRunRecord | null {
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT id, user_prompt as userPrompt, status, plan_json, result_summary as resultSummary,
              error, created_at as createdAt, updated_at as updatedAt
       FROM automation_runs WHERE id = ?`
    )
    .get(id) as {
    id: string;
    userPrompt: string;
    status: string;
    plan_json: string | null;
    resultSummary: string | null;
    error: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  if (!row) return null;
  return {
    ...row,
    status: row.status as AutomationRunStatus,
    plan: parsePlanJson(row.plan_json),
  };
}

export function listAutomationRuns(limit = 30): AutomationRunRecord[] {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT id, user_prompt as userPrompt, status, plan_json, result_summary as resultSummary,
              error, created_at as createdAt, updated_at as updatedAt
       FROM automation_runs ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as Array<{
    id: string;
    userPrompt: string;
    status: string;
    plan_json: string | null;
    resultSummary: string | null;
    error: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  return rows.map((row) => ({
    ...row,
    status: row.status as AutomationRunStatus,
    plan: parsePlanJson(row.plan_json),
  }));
}

export async function planAutomationRun(runId: string): Promise<AgentPlan> {
  const db = getAgentDb();
  const run = getAutomationRun(runId);
  if (!run) throw new Error("Run not found");
  const provider = getAgentModelProvider();
  const plan = await provider.createPlan(run.userPrompt);
  const now = nowIso();
  db.prepare(
    `UPDATE automation_runs SET status = 'planning', plan_json = ?, updated_at = ? WHERE id = ?`
  ).run(JSON.stringify(plan), now, runId);
  return plan;
}

export async function waitForAutomationStarted(runId: string, timeoutMs = 25_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const db = getAgentDb();
    const row = db
      .prepare(
        `SELECT 1 as ok FROM automation_logs WHERE run_id = ? AND message = 'automation.started' LIMIT 1`
      )
      .get(runId) as { ok: number } | undefined;
    if (row) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

export async function dispatchRunToDesktop(runId: string): Promise<void> {
  const run = getAutomationRun(runId);
  if (!run) throw new Error("Run not found");
  const res = await fetch(`${DESKTOP_AGENT_URL}/alyson/automation/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, prompt: run.userPrompt, plan: run.plan }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Desktop agent unavailable: ${text || res.status}`);
  }
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(`UPDATE automation_runs SET status = 'running', updated_at = ? WHERE id = ?`).run(
    now,
    runId
  );
}

export function recordToolCall(
  runId: string,
  tool: string,
  args: Record<string, unknown>,
  result: ToolCallResult,
  stepId?: string
): void {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(
    `INSERT INTO tool_calls (id, run_id, step_id, tool, status, args_json, result_json, screenshot, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    runId,
    stepId ?? null,
    tool,
    result.status,
    JSON.stringify(args),
    JSON.stringify(result),
    result.screenshot ?? null,
    result.error ?? null,
    now
  );
}

export function createApprovalRequest(input: {
  runId: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  tool: string;
}): string {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  const risk = classifyToolRisk(input.tool, {
    linkedin: input.tool.startsWith("linkedin."),
  });
  db.prepare(
    `INSERT INTO approval_requests (id, run_id, title, description, risk_level, payload_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id,
    input.runId,
    input.title,
    input.description,
    risk,
    JSON.stringify(input.payload),
    now
  );
  db.prepare(
    `UPDATE automation_runs SET status = 'awaiting_approval', updated_at = ? WHERE id = ?`
  ).run(now, input.runId);
  return id;
}

export function resolveApproval(
  approvalId: string,
  status: "approved" | "rejected" | "edited",
  resolvedBy = "user"
): void {
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(
    `UPDATE approval_requests SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?`
  ).run(status, now, resolvedBy, approvalId);
  const row = db
    .prepare(`SELECT run_id FROM approval_requests WHERE id = ?`)
    .get(approvalId) as { run_id: string } | undefined;
  if (row && status === "approved") {
    db.prepare(`UPDATE automation_runs SET status = 'running', updated_at = ? WHERE id = ?`).run(
      now,
      row.run_id
    );
  }
}

export function listPendingApprovals(runId?: string): ApprovalRequestRecord[] {
  const db = getAgentDb();
  const rows = runId
    ? db
        .prepare(
          `SELECT id, run_id as runId, title, description, risk_level as riskLevel,
                  payload_json, status, created_at as createdAt
           FROM approval_requests WHERE status = 'pending' AND run_id = ? ORDER BY created_at DESC`
        )
        .all(runId)
    : db
        .prepare(
          `SELECT id, run_id as runId, title, description, risk_level as riskLevel,
                  payload_json, status, created_at as createdAt
           FROM approval_requests WHERE status = 'pending' ORDER BY created_at DESC`
        )
        .all();
  return (rows as Array<{
    id: string;
    runId: string;
    title: string;
    description: string;
    riskLevel: string;
    payload_json: string;
    status: string;
    createdAt: string;
  }>).map((r) => ({
    id: r.id,
    runId: r.runId,
    title: r.title,
    description: r.description,
    riskLevel: r.riskLevel as ApprovalRequestRecord["riskLevel"],
    payload: JSON.parse(r.payload_json) as Record<string, unknown>,
    status: r.status as ApprovalRequestRecord["status"],
    createdAt: r.createdAt,
  }));
}

export async function startAutomation(userPrompt: string, deviceId?: string): Promise<string> {
  const runId = createAutomationRun(userPrompt, deviceId);
  await planAutomationRun(runId);
  try {
    await dispatchRunToDesktop(runId);
    const started = await waitForAutomationStarted(runId);
    if (!started) {
      const message =
        "Desktop agent could not sync with CRM. Restart Desktop Agent (close and re-run Start-Alyson.bat) — CRM must be at http://localhost:3000.";
      failAutomationRun(runId, message);
      throw new Error(message);
    }
  } catch (err) {
    const db = getAgentDb();
    const now = nowIso();
    const message = err instanceof Error ? err.message : "Desktop agent unavailable";
    if (!message.includes("could not sync")) {
      db.prepare(
        `UPDATE automation_runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`
      ).run(message, now, runId);
    }
    throw err;
  }
  return runId;
}

/** Start automation with a pre-built plan (Hermes Engine / DeepSeek). */
export async function startAutomationWithPlan(
  userPrompt: string,
  plan: AgentPlan,
  deviceId?: string
): Promise<string> {
  const runId = createAutomationRun(userPrompt, deviceId);
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(
    `UPDATE automation_runs SET status = 'planning', plan_json = ?, updated_at = ? WHERE id = ?`
  ).run(JSON.stringify(plan), now, runId);
  try {
    await dispatchRunToDesktop(runId);
    const started = await waitForAutomationStarted(runId);
    if (!started) {
      const message =
        "Desktop agent could not sync with CRM. Restart Desktop Agent (close and re-run Start-Alyson.bat) — CRM must be at http://localhost:3000.";
      failAutomationRun(runId, message);
      throw new Error(message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Desktop agent unavailable";
    if (!message.includes("could not sync")) {
      db.prepare(
        `UPDATE automation_runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`
      ).run(message, now, runId);
    }
    throw err;
  }
  return runId;
}

export function completeAutomationRun(runId: string, summary: string): void {
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(
    `UPDATE automation_runs SET status = 'completed', result_summary = ?, completed_at = ?, updated_at = ? WHERE id = ?`
  ).run(summary, now, now, runId);
  syncHermesMissionForRun(runId, "completed", { resultSummary: summary });
}

export function failAutomationRun(runId: string, error: string): void {
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(
    `UPDATE automation_runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`
  ).run(error, now, runId);
  syncHermesMissionForRun(runId, "failed", { error });
}

function syncHermesMissionForRun(
  runId: string,
  status: "completed" | "failed" | "cancelled",
  extra?: { resultSummary?: string; error?: string }
): void {
  const db = getAgentDb();
  const row = db
    .prepare(`SELECT id FROM hermes_missions WHERE automation_run_id = ? LIMIT 1`)
    .get(runId) as { id: string } | undefined;
  if (!row) return;
  const now = nowIso();
  db.prepare(
    `UPDATE hermes_missions SET
       status = ?,
       result_summary = COALESCE(?, result_summary),
       error = COALESCE(?, error),
       completed_at = ?,
       updated_at = ?
     WHERE id = ?`
  ).run(
    status,
    extra?.resultSummary ?? null,
    extra?.error ?? null,
    now,
    now,
    row.id
  );
}

/** Mark runs stuck with no progress as failed so UI does not show ghost missions. */
export function reconcileStaleAutomationRuns(staleMinutes = 12): number {
  const db = getAgentDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString();
  const stale = db
    .prepare(
      `SELECT r.id
       FROM automation_runs r
       WHERE r.status IN ('running', 'planning', 'awaiting_approval')
         AND r.updated_at < ?
         AND NOT EXISTS (SELECT 1 FROM tool_calls t WHERE t.run_id = r.id)
         AND NOT EXISTS (
           SELECT 1 FROM automation_logs l
           WHERE l.run_id = r.id AND l.message = 'automation.started'
         )`
    )
    .all(cutoff) as Array<{ id: string }>;

  for (const row of stale) {
    failAutomationRun(
      row.id,
      "Desktop agent never synced with CRM (0 browser actions). Close the Desktop Agent window and re-run Start-Alyson.bat, then launch a new mission."
    );
  }
  return stale.length;
}
