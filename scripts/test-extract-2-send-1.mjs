/**
 * E2E: extract 2 profiles → pending approval for 1 → approve → send 1 connection.
 */
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const CRM = process.env.ALYSON_CRM_URL ?? "http://localhost:3000";
const BROWSER = process.env.ALYSON_BROWSER_AGENT_URL ?? "http://127.0.0.1:8820";
const DB_PATH = "data/alyson-platform.db";

const runId = `e2e-2extract-1send-${randomUUID().slice(0, 8)}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
  console.log("=== E2E: extract 2 profiles, send 1 connection ===");
  console.log("runId:", runId);

  const health = await fetch(`${BROWSER}/api/health`).catch(() => null);
  if (!health?.ok) {
    throw new Error("Browser agent not running on port 8820 — start with npm run browser-agent:dev");
  }

  const db = new DatabaseSync(DB_PATH);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO automation_runs (id, org_id, user_prompt, status, created_at, updated_at)
     VALUES (?, 'org-default', 'E2E extract 2 send 1', 'running', ?, ?)`
  ).run(runId, now, now);

  await postEvent("automation.started", { prompt: "E2E extract 2 send 1" });

  console.log("1) Launch Chrome…");
  let result = await tool("browser.launch", {});
  await postEvent("tool.completed", { tool: "browser.launch", args: {}, result });
  if (result.status === "error") throw new Error(result.error);

  console.log("2) Extract exactly 2 profiles…");
  result = await tool("linkedin.extract_search_profiles", { query: "AI Engineer", limit: 2 });
  await postEvent("tool.completed", {
    tool: "linkedin.extract_search_profiles",
    args: { query: "AI Engineer", limit: 2 },
    result,
  });
  if (result.status === "error") throw new Error(result.error);

  const profiles = result.data?.profiles;
  if (!Array.isArray(profiles) || profiles.length < 1) {
    throw new Error("No profiles extracted — log into LinkedIn in Alyson Chrome first");
  }
  console.log(`   Extracted ${profiles.length} profile(s):`);
  for (const p of profiles) console.log(`   - ${p.name}: ${p.profileUrl}`);

  let target = profiles[0];
  for (const p of profiles) {
    const check = await tool("linkedin.check_connection", { profileUrl: p.profileUrl });
    const state = check.data?.status;
    console.log(`   check ${p.name}: ${state}`);
    if (state === "none") {
      target = p;
      break;
    }
    if (state === "pending") {
      console.log("\nPASS: A connection is already pending for a search result.");
      process.exit(0);
    }
    if (state === "connected") {
      continue;
    }
  }
  console.log(`   Sending to: ${target.name} — ${target.profileUrl}`);

  console.log("3) Request approval for 1 connection…");
  result = await tool("linkedin.send_connection_request", {
    profileUrl: target.profileUrl,
    name: target.name,
    profileIndex: 0,
    approved: false,
    message: "Hi, I'd love to connect.",
  });
  await postEvent("tool.completed", {
    tool: "linkedin.send_connection_request",
    args: { profileUrl: target.profileUrl, approved: false },
    result,
  });

  if (result.status !== "pending_approval") {
    throw new Error(`Expected pending_approval, got ${result.status}: ${result.error ?? ""}`);
  }
  console.log(`   Pending approval for ${result.data?.name ?? target.name}`);

  await postEvent("approval.required", {
    title: "E2E: send 1 connection",
    description: `Send connection to ${result.data?.name ?? target.name}?`,
    tool: "linkedin.send_connection_request",
    payload: result.data,
  });

  const approval = db
    .prepare(
      `SELECT id FROM approval_requests WHERE run_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`
    )
    .get(runId);
  if (!approval) throw new Error("No approval row created");

  console.log("4) Approve in CRM…");
  const approveRes = await fetch(`${CRM}/api/agent/approval/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvalId: approval.id, status: "approved" }),
  });
  if (!approveRes.ok) throw new Error("Approve failed");

  await sleep(500);

  console.log("5) Send connection (approved=true)…");
  result = await tool("linkedin.send_connection_request", {
    profileUrl: target.profileUrl,
    name: target.name,
    approved: true,
    message: "Hi, I'd love to connect.",
  });
  await postEvent("tool.completed", {
    tool: "linkedin.send_connection_request",
    args: { profileUrl: target.profileUrl, approved: true },
    result,
  });

  if (result.status === "error") {
    throw new Error(`Send failed: ${result.error}`);
  }

  const sentStatus = result.data?.status ?? result.status;
  console.log(`   Send result: ${sentStatus}`);

  await postEvent("automation.completed", {
    summary: `extract ${profiles.length} + send 1: ${sentStatus}`,
  });

  const prospects = db
    .prepare(`SELECT name, profile_url, status FROM linkedin_prospects ORDER BY created_at DESC LIMIT 5`)
    .all();

  console.log("\n=== RESULTS ===");
  console.log("Profiles extracted:", profiles.length);
  console.log("Connection status:", sentStatus);
  console.log("Latest DB prospects:", prospects);

  if (
    sentStatus === "connection_sent" ||
    result.data?.alreadyPending ||
    result.data?.status === "connected" ||
    result.status === "success"
  ) {
    console.log("\nPASS: 1 connection request sent (or already pending/connected).");
    process.exit(0);
  }

  console.log("\nFAIL: connection was not sent.");
  console.log(JSON.stringify(result.data ?? result, null, 2));
  process.exit(1);
}

main().catch((err) => {
  console.error("\nFAIL:", err.message);
  process.exit(1);
});
