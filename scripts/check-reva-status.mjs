import { DatabaseSync } from "node:sqlite";
import { backfillProspectsFromToolCalls } from "../src/lib/agent/services/prospect-sync.ts";

backfillProspectsFromToolCalls();
const db = new DatabaseSync("data/alyson-platform.db");
const r = db
  .prepare(
    `SELECT name, status, metadata_json FROM linkedin_prospects WHERE profile_url LIKE '%reva%'`
  )
  .get();
console.log("reva:", r);
const sent = db
  .prepare(
    `SELECT COUNT(*) as c FROM linkedin_prospects WHERE status IN ('connection_sent','invite_pending')`
  )
  .get();
console.log("sent count:", sent);
