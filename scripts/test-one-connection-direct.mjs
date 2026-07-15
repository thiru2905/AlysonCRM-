/**
 * Direct E2E: extract 1 profile → pending approval → approve → send 1 connection.
 */
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const CRM = process.env.ALYSON_CRM_URL ?? "http://localhost:3000";
const BROWSER = process.env.ALYSON_BROWSER_AGENT_URL ?? "http://127.0.0.1:8820";
const DB_PATH = "data/alyson-platform.db";

const runId = `e2e-direct-${randomUUID().slice(0, 8)}`;

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
  console.log("=== Direct E2E: 1 connection ===");
  console.log("runId:", runId);

  const db = new DatabaseSync(DB_PATH);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO automation_runs (id, org_id, user_prompt, status, created_at, updated_at)
     VALUES (?, 'org-default', 'E2E direct 1 connection', 'running', ?, ?)`
  ).run(runId, now, now);

  await postEvent("automation.started", { prompt: "E2E direct 1 connection" });

  console.log("1) Launch Chrome…");
  let result = await tool("browser.launch", {});
  await postEvent("tool.completed", { tool: "browser.launch", args: {}, result });
  if (result.status === "error") throw new Error(result.error);

  console.log("2) Extract up to 3 profiles, pick first connectable…");
  result = await tool("linkedin.extract_search_profiles", { query: "AI Engineer", limit: 3 });
  await postEvent("tool.completed", {
    tool: "linkedin.extract_search_profiles",
    args: { query: "AI Engineer", limit: 3 },
    result,
  });
  if (result.status === "error") throw new Error(result.error);

  const profiles = result.data?.profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) {
    throw new Error("No profiles extracted — log into LinkedIn in Alyson Chrome first");
  }

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
  }
  console.log(`   Using: ${target.name} — ${target.profileUrl}`);

  console.log("3) Open profile + request approval…");
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
    title: "E2E test: send 1 connection",
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

  console.log("4) Approve…");
  const approveRes = await fetch(`${CRM}/api/agent/approval/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvalId: approval.id, status: "approved" }),
  });
  if (!approveRes.ok) throw new Error("Approve failed");

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

  if (result.status === "error") throw new Error(`Send failed: ${result.error}`);

  const sentStatus = result.data?.status;
  console.log(`   Send result: ${sentStatus ?? result.status}`);

  await postEvent("automation.completed", {
    summary: `extract + send: ${sentStatus ?? result.status}`,
  });

  const prospects = db
    .prepare(`SELECT name, profile_url, status FROM linkedin_prospects ORDER BY created_at DESC LIMIT 3`)
    .all();

  console.log("\n=== RESULTS ===");
  console.log("Connection status:", sentStatus ?? result.status);
  console.log("Latest profiles:", prospects);

  if (sentStatus === "connection_sent" || result.data?.alreadyPending || result.data?.status === "connected") {
    console.log("\nPASS: 1 connection request sent (or already pending/connected on LinkedIn).");
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
