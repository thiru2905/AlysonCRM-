import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("data/alyson-platform.db");
const row = db
  .prepare(
    `SELECT result_json FROM tool_calls
     WHERE run_id = 'e2e-direct-75346549' AND status = 'error'
       AND tool = 'linkedin.send_connection_request'
     ORDER BY created_at DESC LIMIT 1`
  )
  .get();
console.log(JSON.stringify(JSON.parse(row.result_json), null, 2));
