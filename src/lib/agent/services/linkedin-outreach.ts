import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import type {
  LinkedInCampaignRecord,
  LinkedInProspectRecord,
  ProfileDetailRecord,
  SequenceStep,
} from "../types";
import {
  getProfileWithMission,
  listProfilesWithMission,
  type ProfileWithMission,
} from "./mission-profiles";
import { isDisplayableProspect, isTestProspect } from "./prospect-filter";

export function createCampaign(input: {
  name: string;
  targetAudience?: string;
  dailyLimit?: number;
  sequence?: SequenceStep[];
}): LinkedInCampaignRecord {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  const sequence = input.sequence ?? [
    { type: "view_profile", requiresApproval: false },
    { type: "wait", delayHours: 24 },
    { type: "connection_request", requiresApproval: true },
    { type: "wait", delayHours: 48 },
    { type: "message", requiresApproval: true, messageTemplate: "Hi {{name}}..." },
    { type: "stop_if_reply" },
  ];
  db.prepare(
    `INSERT INTO linkedin_campaigns (id, org_id, name, target_audience, sequence_json, daily_limit, status, created_at, updated_at)
     VALUES (?, 'org-default', ?, ?, ?, ?, 'draft', ?, ?)`
  ).run(
    id,
    input.name,
    input.targetAudience ?? null,
    JSON.stringify(sequence),
    input.dailyLimit ?? 25,
    now,
    now
  );
  return {
    id,
    name: input.name,
    targetAudience: input.targetAudience ?? null,
    dailyLimit: input.dailyLimit ?? 25,
    status: "draft",
    sequence,
    createdAt: now,
  };
}

export function listCampaigns(): LinkedInCampaignRecord[] {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT id, name, target_audience as targetAudience, daily_limit as dailyLimit,
              status, sequence_json, created_at as createdAt
       FROM linkedin_campaigns ORDER BY created_at DESC`
    )
    .all() as Array<{
    id: string;
    name: string;
    targetAudience: string | null;
    dailyLimit: number;
    status: string;
    sequence_json: string;
    createdAt: string;
  }>;
  return rows.map((r) => ({
    ...r,
    sequence: JSON.parse(r.sequence_json) as SequenceStep[],
  }));
}

export function addProspect(input: {
  campaignId?: string;
  name: string;
  profileUrl: string;
  company?: string;
  title?: string;
  location?: string;
}): LinkedInProspectRecord {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(
    `INSERT INTO linkedin_prospects (id, campaign_id, name, profile_url, company, title, location, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
  ).run(
    id,
    input.campaignId ?? null,
    input.name,
    input.profileUrl,
    input.company ?? null,
    input.title ?? null,
    input.location ?? null,
    now
  );
  return {
    id,
    campaignId: input.campaignId ?? null,
    name: input.name,
    profileUrl: input.profileUrl,
    company: input.company ?? null,
    title: input.title ?? null,
    location: input.location ?? null,
    status: "new",
  };
}

export function listProspects(campaignId?: string): LinkedInProspectRecord[] {
  const db = getAgentDb();
  const rows = campaignId
    ? db
        .prepare(
          `SELECT id, campaign_id as campaignId, name, profile_url as profileUrl, company, title, location, status,
                  created_at as createdAt, last_action_at as lastActionAt
           FROM linkedin_prospects WHERE campaign_id = ? ORDER BY created_at DESC`
        )
        .all(campaignId)
    : db
        .prepare(
          `SELECT id, campaign_id as campaignId, name, profile_url as profileUrl, company, title, location, status,
                  created_at as createdAt, last_action_at as lastActionAt
           FROM linkedin_prospects ORDER BY created_at DESC LIMIT 200`
        )
        .all();
  return rows as LinkedInProspectRecord[];
}

export function getProfile(id: string): ProfileDetailRecord | null {
  return getProfileWithMission(id);
}

/** Real profiles from Hermes missions and LinkedIn automation — no manual test rows. */
export function listProfiles(): ProfileWithMission[] {
  const db = getAgentDb();
  const testRows = db
    .prepare(`SELECT id, name, profile_url as profileUrl FROM linkedin_prospects`)
    .all() as Array<{ id: string; name: string; profileUrl: string }>;

  for (const row of testRows) {
    if (isTestProspect(row)) {
      db.prepare(`DELETE FROM linkedin_prospects WHERE id = ?`).run(row.id);
    }
  }

  return listProfilesWithMission().filter((p) =>
    isDisplayableProspect({
      name: p.name,
      profileUrl: p.profileUrl,
      status: p.status,
      metadata_json: p.metadataJson ?? null,
      missionId: p.missionId,
      missionName: p.missionName,
    })
  );
}

export function createMessageDraft(prospectId: string, body: string): string {
  const db = getAgentDb();
  const id = uuidv4();
  const now = nowIso();
  db.prepare(
    `INSERT INTO linkedin_messages (id, prospect_id, direction, body, status, created_at)
     VALUES (?, ?, 'outbound', ?, 'draft', ?)`
  ).run(id, prospectId, body, now);
  return id;
}
