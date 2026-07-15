/**
 * Send 1 connection to Reva Chinchalkar and sync to CRM.
 */
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const CRM = process.env.ALYSON_CRM_URL ?? "http://localhost:3000";
const BROWSER = process.env.ALYSON_BROWSER_AGENT_URL ?? "http://127.0.0.1:8820";
const DB_PATH = "data/alyson-platform.db";

const target = {
  name: "Reva Chinchalkar",
  profileUrl: "https://www.linkedin.com/in/reva-chinchalkar",
};

const runId = `send-1-${randomUUID().slice(0, 8)}`;

async function tool(name, args) {
  const res = await fetch(`${BROWSER}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: name, args: { ...args, runId } }),
  });
  if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
  return res.json();
}

async function postEvent(type, payload) {
  await fetch(`${CRM}/api/agent/automation/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, type, payload: { runId, ...payload } }),
  });
}

async function main() {
  console.log("Sending 1 connection to", target.name);
  console.log("runId:", runId);

  const db = new DatabaseSync(DB_PATH);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO automation_runs (id, org_id, user_prompt, status, created_at, updated_at)
     VALUES (?, 'org-default', 'Send 1 connection to Reva', 'running', ?, ?)`
  ).run(runId, now, now);

  await postEvent("automation.started", { prompt: "Send 1 connection" });

  console.log("Launch Chrome…");
  let result = await tool("browser.launch", {});
  await postEvent("tool.completed", { tool: "browser.launch", args: {}, result });

  console.log("Send connection (approved)…");
  result = await tool("linkedin.send_connection_request", {
    profileUrl: target.profileUrl,
    name: target.name,
    approved: true,
    message: "Hi Reva, I'd love to connect.",
  });
  await postEvent("tool.completed", {
    tool: "linkedin.send_connection_request",
    args: { profileUrl: target.profileUrl, approved: true },
    result,
  });

  if (result.status === "error") {
    console.error("FAIL:", result.error);
    if (result.data) console.error(JSON.stringify(result.data, null, 2));
    process.exit(1);
  }

  console.log("Result:", JSON.stringify(result.data ?? result, null, 2));

  await postEvent("automation.completed", {
    summary: `connection: ${result.data?.status ?? result.status}`,
  });

  const row = db
    .prepare(`SELECT name, status FROM linkedin_prospects WHERE profile_url LIKE ?`)
    .get("%reva-chinchalkar%");
  console.log("DB prospect:", row);

  console.log("\nPASS — check Browser Workers Activity for 1 sent.");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
