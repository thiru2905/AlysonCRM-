import os from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { loadCredentials, saveCredentials } from "./secure-store.js";
import { runAutomation } from "./automation.js";
import {
  getConfiguredCrmUrl,
  isCrmReachable,
  postCrmEvent,
  resolveCrmUrl,
} from "./crm-client.js";

function slimToolResult(result: Record<string, unknown>): Record<string, unknown> {
  const screenshot = result.screenshot;
  return {
    ...result,
    screenshot:
      typeof screenshot === "string" && screenshot.length > 0
        ? "[captured]"
        : screenshot ?? null,
  };
}

const CRM_URL = getConfiguredCrmUrl();
const BROWSER_AGENT_URL =
  process.env.ALYSON_BROWSER_AGENT_URL?.trim() ?? "http://127.0.0.1:8820";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown
) => Promise<void> | void;

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

async function postCrmEventWrapped(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  await postCrmEvent(type, payload, slimToolResult);
}

async function heartbeatLoop(): Promise<void> {
  const creds = loadCredentials();
  if (!creds) return;
  setInterval(async () => {
    const crmUrl = await resolveCrmUrl();
    await fetch(`${crmUrl}/api/agent/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.deviceId}:${creds.deviceToken}`,
      },
      body: JSON.stringify({ status: "connected", payload: { version: "0.1.0" } }),
    }).catch(() => undefined);
  }, 30_000);
}

void heartbeatLoop();

const routes: Record<string, Handler> = {
  "GET /alyson/health": async (_req, res) => {
    const creds = loadCredentials();
    const crmUrl = await resolveCrmUrl();
    const crmReachable = await isCrmReachable();
    sendJson(res, 200, {
      ok: true,
      service: "alyson-desktop-agent",
      version: "0.1.0",
      paired: Boolean(creds),
      deviceId: creds?.deviceId ?? null,
      browserAgentUrl: BROWSER_AGENT_URL,
      crmUrl,
      crmReachable,
    });
  },

  "POST /alyson/pair": async (_req, res, body) => {
    const input = body as { code?: string; name?: string };
    if (!input.code) {
      sendJson(res, 400, { error: "code is required" });
      return;
    }
    try {
      const crmUrl = await resolveCrmUrl();
      const exchange = await fetch(`${crmUrl}/api/agent/pair/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: input.code,
          name: input.name ?? os.hostname(),
          platform: process.platform,
          version: "0.1.0",
        }),
      });
      if (!exchange.ok) {
        const err = await exchange.text().catch(() => "");
        sendJson(res, 400, { error: err || "Pairing failed" });
        return;
      }
      const result = (await exchange.json()) as { deviceId: string; deviceToken: string };
      saveCredentials({
        deviceId: result.deviceId,
        deviceToken: result.deviceToken,
        crmUrl: await resolveCrmUrl(),
        pairedAt: new Date().toISOString(),
      });
      sendJson(res, 200, { ok: true, deviceId: result.deviceId });
    } catch {
      sendJson(res, 503, {
        error: `Cannot reach Alyson CRM at ${CRM_URL}. Start the CRM dev server first (npm run dev).`,
      });
    }
  },

  "POST /alyson/automation/start": async (_req, res, body) => {
    const input = body as { runId?: string; prompt?: string; plan?: unknown };
    if (!input.runId || !input.prompt) {
      sendJson(res, 400, { error: "runId and prompt are required" });
      return;
    }
    sendJson(res, 202, { ok: true, runId: input.runId });
    const crmUrl = await resolveCrmUrl();
    void runAutomation({
      runId: input.runId,
      prompt: input.prompt,
      plan: input.plan as { summary: string; steps: Array<Record<string, unknown>> } | undefined,
      browserAgentUrl: BROWSER_AGENT_URL,
      crmUrl,
      onEvent: postCrmEventWrapped,
    });
  },

  "GET /alyson/status": async (_req, res) => {
    const creds = loadCredentials();
    const crmUrl = await resolveCrmUrl();
    sendJson(res, 200, {
      paired: Boolean(creds),
      deviceId: creds?.deviceId ?? null,
      crmUrl,
      crmReachable: await isCrmReachable(),
    });
  },
};

export function createAgentApp() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const key = `${req.method} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    const body = req.method === "POST" ? await readBody(req) : {};
    await handler(req, res, body);
  };
}
