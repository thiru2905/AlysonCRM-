/**
 * End-to-end test: extract 1 profile + send 1 connection (with approval).
 * Safe limit: exactly 1 connection request.
 */
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const CRM = process.env.ALYSON_CRM_URL ?? "http://localhost:3000";
const DESKTOP = process.env.ALYSON_DESKTOP_AGENT_URL ?? "http://127.0.0.1:8787";
const DB_PATH = "data/alyson-platform.db";

const runId = `e2e-test-${randomUUID().slice(0, 8)}`;
const now = new Date().toISOString();

const plan = {
  summary: "E2E test — 1 profile, 1 connection",
  steps: [
    { id: "s1", tool: "browser.launch", description: "Launch Chrome", args: {} },
    { id: "s2", tool: "linkedin.check_login", description: "Check LinkedIn login", args: {} },
    {
      id: "s3",
      tool: "linkedin.extract_search_profiles",
      description: "Extract 1 profile",
      args: { query: "AI Engineer", limit: 1 },
    },
    {
      id: "s4",
      tool: "linkedin.send_connection_request",
      description: "Send 1 connection (approve to send)",
      args: { profileIndex: 0, approved: false, message: "Hi, I'd love to connect." },
      requiresApproval: true,
    },
  ],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function db() {
  return new DatabaseSync(DB_PATH);
}

async function main() {
  console.log("=== E2E test: 1 connection only ===");
  console.log("runId:", runId);

  const database = db();
  database
    .prepare(
      `INSERT INTO automation_runs (id, org_id, device_id, user_prompt, status, plan_json, created_at, updated_at)
       VALUES (?, 'org-default', NULL, ?, ?, 'running', ?, ?)`
    )
    .run(runId, "E2E test: 1 connection", JSON.stringify(plan), now, now);

  const startRes = await fetch(`${DESKTOP}/alyson/automation/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, prompt: "E2E test: 1 connection", plan }),
  });
  if (!startRes.ok) {
    throw new Error(`Desktop start failed: ${startRes.status} ${await startRes.text()}`);
  }
  console.log("Desktop automation started (202)");

  // Wait for extract + pending approval (up to 3 min)
  let approvalId = null;
  let profileUrl = null;
  let profileName = null;

  for (let i = 0; i < 90; i++) {
    await sleep(2000);

    const extract = database
      .prepare(
        `SELECT status, result_json FROM tool_calls WHERE run_id = ? AND tool = 'linkedin.extract_search_profiles' ORDER BY created_at DESC LIMIT 1`
      )
      .get(runId);

    if (extract) {
      const result = JSON.parse(extract.result_json);
      const profiles = result?.data?.profiles;
      if (Array.isArray(profiles) && profiles.length > 0) {
        console.log(`Extract OK: ${profiles[0].name} — ${profiles[0].profileUrl}`);
      } else if (extract.status === "success") {
        console.log("Extract tool completed but profiles array empty/missing");
      }
    }

    const pendingSend = database
      .prepare(
        `SELECT result_json FROM tool_calls
         WHERE run_id = ? AND tool = 'linkedin.send_connection_request'
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(runId);

    if (pendingSend) {
      const sendResult = JSON.parse(pendingSend.result_json);
      if (sendResult.status === "pending_approval") {
        const data = sendResult.data ?? {};
        profileUrl = data.profileUrl;
        profileName = data.name;
        const approval = database
          .prepare(
            `SELECT id FROM approval_requests WHERE run_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`
          )
          .get(runId);
        approvalId = approval?.id ?? null;
        console.log(`Approval pending: ${profileName ?? "?"} — ${profileUrl ?? "?"}`);
        break;
      }
      if (sendResult.status === "error") {
        throw new Error(`Send step failed before approval: ${sendResult.error}`);
      }
    }

    const approvalEarly = database
      .prepare(
        `SELECT id FROM approval_requests WHERE run_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`
      )
      .get(runId);
    if (approvalEarly && i > 0) {
      /* wait for pending_approval tool result before approving */
    }

    void approvalEarly;

    const failed = database
      .prepare(`SELECT error, status FROM automation_runs WHERE id = ?`)
      .get(runId);
    if (failed?.status === "failed") {
      throw new Error(`Run failed: ${failed.error}`);
    }

    const logs = database
      .prepare(`SELECT message FROM automation_logs WHERE run_id = ? AND message = 'automation.failed' LIMIT 1`)
      .get(runId);
    if (logs) {
      const errLog = database
        .prepare(`SELECT payload_json FROM automation_logs WHERE run_id = ? AND message = 'automation.failed' LIMIT 1`)
        .get(runId);
      throw new Error(`Automation failed: ${errLog?.payload_json ?? "unknown"}`);
    }

    if (i % 5 === 0) console.log(`  waiting… (${i * 2}s)`);
  }

  if (!approvalId) {
    const tools = database
      .prepare(`SELECT tool, status FROM tool_calls WHERE run_id = ?`)
      .all(runId);
    const logs = database
      .prepare(`SELECT message FROM automation_logs WHERE run_id = ? ORDER BY created_at`)
      .all(runId);
    console.log("Tool calls:", tools);
    console.log("Logs:", logs.map((l) => l.message));
    throw new Error("Timed out waiting for connection approval step");
  }

  // Approve the single connection
  const approveRes = await fetch(`${CRM}/api/agent/approval/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvalId, status: "approved" }),
  });
  if (!approveRes.ok) {
    throw new Error(`Approve failed: ${approveRes.status}`);
  }
  console.log("Approved connection request — waiting for send…");

  // Wait for send_connection_request to complete (up to 2 min)
  for (let i = 0; i < 60; i++) {
    await sleep(2000);

    const send = database
      .prepare(
        `SELECT status, result_json FROM tool_calls WHERE run_id = ? AND tool = 'linkedin.send_connection_request' ORDER BY created_at DESC LIMIT 1`
      )
      .get(runId);

    if (send) {
      const result = JSON.parse(send.result_json);
      if (send.status === "success" || result.status === "success") {
        const data = result.data ?? {};
        console.log(`Connection result: status=${data.status ?? result.status}, profile=${data.profileUrl ?? profileUrl}`);
        break;
      }
      if (result.status === "error" || send.status === "error") {
        throw new Error(`Send failed: ${result.error ?? "unknown"}`);
      }
    }

    const run = database.prepare(`SELECT status, result_summary, error FROM automation_runs WHERE id = ?`).get(runId);
    if (run?.status === "completed") {
      console.log("Run completed:", run.result_summary);
      break;
    }
    if (run?.status === "failed") {
      throw new Error(`Run failed after approve: ${run.error}`);
    }
  }

  const prospects = database
    .prepare(
      `SELECT name, profile_url, status, metadata_json FROM linkedin_prospects ORDER BY created_at DESC LIMIT 5`
    )
    .all();

  const sendTool = database
    .prepare(
      `SELECT status, result_json FROM tool_calls WHERE run_id = ? AND tool = 'linkedin.send_connection_request' ORDER BY created_at DESC LIMIT 1`
    )
    .get(runId);

  const runFinal = database.prepare(`SELECT status, result_summary, error FROM automation_runs WHERE id = ?`).get(runId);

  console.log("\n=== RESULTS ===");
  console.log("Run status:", runFinal?.status, runFinal?.error ?? runFinal?.result_summary ?? "");
  console.log("Send tool:", sendTool ? JSON.parse(sendTool.result_json).data ?? JSON.parse(sendTool.result_json) : "none");
  console.log("Saved profiles (latest 5):", prospects);

  const sentOk =
    sendTool &&
    (JSON.parse(sendTool.result_json).data?.status === "connection_sent" ||
      JSON.parse(sendTool.result_json).status === "success");

  if (sentOk) {
    console.log("\nPASS: 1 connection request was sent successfully.");
    process.exit(0);
  }

  console.log("\nPARTIAL: Extract/approval worked but connection send status unclear — check Browser Workers UI.");
  process.exit(1);
}

main().catch((err) => {
  console.error("\nFAIL:", err.message);
  process.exit(1);
});
