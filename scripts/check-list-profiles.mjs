import { listProfiles } from "../src/lib/agent/services/linkedin-outreach.ts";
import { backfillProspectsFromToolCalls } from "../src/lib/agent/services/prospect-sync.ts";

backfillProspectsFromToolCalls();
const profiles = listProfiles();
console.log("count", profiles.length);
for (const p of profiles) {
  console.log("-", p.name, p.status, p.missionName ?? "(no mission)");
}
