import {
  exchangePairingCode,
  recordHeartbeat,
  validateDeviceToken,
} from "./services/devices";
import { generateWindowsBat, generateWindowsPs1 } from "./installer";
import { getApprovalStatusForRun } from "./services/browser-workers";
import {
  syncProspectsFromApprovalPayload,
  syncProspectsFromToolResult,
} from "./services/prospect-sync";
import {
  completeAutomationRun,
  createApprovalRequest,
  failAutomationRun,
  listAutomationRuns,
  recordToolCall,
  reconcileStaleAutomationRuns,
  resolveApproval,
} from "./services/automation";
import { listProfiles } from "./services/linkedin-outreach";
import { backfillProspectsFromToolCalls } from "./services/prospect-sync";
import {
  getBrowserWorkersStats,
  listConnections,
  listToolCalls,
} from "./services/browser-workers";
import { getAgentDb, nowIso } from "./db/client";
import type { ToolCallResult } from "./types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

function getBearerDevice(request: Request): { deviceId: string; token: string } | null {
  const auth = request.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+([^:]+):(.+)$/i);
  if (!match) return null;
  return { deviceId: match[1], token: match[2] };
}

export async function handleAgentApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/agent")) return null;

  const path = url.pathname.replace(/^\/api\/agent/, "") || "/";

  try {
    if (path === "/pair/exchange" && request.method === "POST") {
      const body = await readJson<{
        code: string;
        name: string;
        platform: string;
        version?: string;
      }>(request);
      const result = exchangePairingCode(body);
      return json(result);
    }

    if (path === "/heartbeat" && request.method === "POST") {
      const auth = getBearerDevice(request);
      if (!auth || !validateDeviceToken(auth.deviceId, auth.token)) {
        return json({ error: "Unauthorized" }, 401);
      }
      const body = await readJson<{ status: string; payload?: unknown }>(request);
      recordHeartbeat(auth.deviceId, body.status, body.payload);
      return json({ ok: true });
    }

    if (path === "/automation/event" && request.method === "POST") {
      const body = await readJson<{
        runId: string;
        type: string;
        payload?: Record<string, unknown>;
      }>(request);
      const db = getAgentDb();
      db.prepare(
        `INSERT INTO automation_logs (run_id, level, message, payload_json, created_at)
         VALUES (?, 'info', ?, ?, ?)`
      ).run(
        body.runId,
        body.type,
        body.payload ? JSON.stringify(body.payload) : null,
        nowIso()
      );
      if (body.type === "automation.started") {
        db.prepare(
          `UPDATE automation_runs SET status = 'running', updated_at = ? WHERE id = ?`
        ).run(nowIso(), body.runId);
      }
      if (body.type === "automation.completed" && body.payload?.summary) {
        completeAutomationRun(body.runId, String(body.payload.summary));
      }
      if (body.type === "automation.failed" && body.payload?.error) {
        failAutomationRun(body.runId, String(body.payload.error));
      }
      if (body.type === "tool.completed" && body.payload) {
        const tool = String(body.payload.tool ?? "unknown");
        const result = body.payload.result as ToolCallResult;
        try {
          recordToolCall(
            body.runId,
            tool,
            (body.payload.args as Record<string, unknown>) ?? {},
            result
          );
        } catch (err) {
          console.error("[agent-api] recordToolCall failed:", err);
        }
        try {
          syncProspectsFromToolResult(tool, result, body.runId);
        } catch (err) {
          console.error("[agent-api] syncProspectsFromToolResult failed:", err);
        }
      }
      if (body.type === "approval.required" && body.payload) {
        try {
          createApprovalRequest({
            runId: body.runId,
            title: String(body.payload.title ?? "Approval required"),
            description: String(body.payload.description ?? ""),
            payload: body.payload,
            tool: String(body.payload.tool ?? "unknown"),
          });
        } catch (err) {
          console.error("[agent-api] createApprovalRequest failed:", err);
        }
        try {
          syncProspectsFromApprovalPayload(
            body.payload as Record<string, unknown>,
            body.runId
          );
        } catch (err) {
          console.error("[agent-api] syncProspectsFromApprovalPayload failed:", err);
        }
      }
      return json({ ok: true });
    }

    if (path === "/approval/resolve" && request.method === "POST") {
      const body = await readJson<{
        approvalId: string;
        status: "approved" | "rejected" | "edited";
      }>(request);
      resolveApproval(body.approvalId, body.status);
      return json({ ok: true });
    }

    if (path === "/approval/status" && request.method === "GET") {
      const runId = url.searchParams.get("runId") ?? "";
      const tool = url.searchParams.get("tool") ?? undefined;
      const profileUrl = url.searchParams.get("profileUrl") ?? undefined;
      if (!runId) return json({ error: "runId required" }, 400);
      const status = getApprovalStatusForRun(runId, tool, profileUrl);
      return json({ status });
    }

    if (path === "/profiles" && request.method === "GET") {
      reconcileStaleAutomationRuns();
      backfillProspectsFromToolCalls();
      return json({ profiles: listProfiles() });
    }

    if (path === "/browser-workers/dashboard" && request.method === "GET") {
      reconcileStaleAutomationRuns();
      backfillProspectsFromToolCalls();
      return json({
        stats: getBrowserWorkersStats(),
        connections: listConnections(false),
        hermesConnections: listConnections(true),
        toolCalls: listToolCalls(40),
        runs: listAutomationRuns(20),
      });
    }

    if (path === "/installer/windows.bat" && request.method === "GET") {
      return new Response(generateWindowsBat(), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="Start-AlysonDesktopAgent.bat"',
        },
      });
    }

    if (path === "/installer/windows.ps1" && request.method === "GET") {
      return new Response(generateWindowsPs1(), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="Start-AlysonDesktopAgent.ps1"',
        },
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent API error";
    return json({ error: message }, 400);
  }
}
