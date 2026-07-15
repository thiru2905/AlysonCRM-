import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { createAgentApp } from "./app.js";
import { resolveCrmUrl } from "./crm-client.js";

function loadEnvFile(filePath: string, overrideKeys?: string[]): void {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (overrideKeys?.includes(key) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

const crmRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnvFile(path.join(crmRoot, ".env"), ["ALYSON_CRM_URL", "ALYSON_BROWSER_AGENT_URL", "ALYSON_DESKTOP_AGENT_URL"]);
loadEnvFile(path.join(crmRoot, "desktop", ".env"), ["ALYSON_CRM_URL", "ALYSON_BROWSER_AGENT_URL"]);

const PORT = Number(process.env.ALYSON_DESKTOP_PORT ?? 8787);
const HOST = process.env.ALYSON_DESKTOP_HOST ?? "127.0.0.1";

const app = createAgentApp();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/alyson/ws" });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "agent.connected", ts: new Date().toISOString() }));
});

server.listen(PORT, HOST, () => {
  console.log(`Alyson Desktop Agent listening on http://${HOST}:${PORT}`);
  void resolveCrmUrl(true).then((url) => {
    console.log(`[desktop] CRM target: ${url}`);
  });
});

export { wss };
