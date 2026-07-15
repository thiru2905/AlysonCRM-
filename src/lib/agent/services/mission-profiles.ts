import { getAgentDb } from "../db/client";
import { inviteStatusFromProspect, type InviteStatus } from "../connection-status";
import type { LinkedInProspectRecord, ProfileDetailRecord } from "../types";

export interface MissionProfileGroup {
  missionId: string;
  missionName: string;
  audience: string;
  status: string;
  runId: string | null;
  profileCount: number;
}

export interface ProfileMissionFields {
  missionId: string | null;
  missionName: string | null;
  missionAudience: string | null;
  missionStatus: string | null;
  inviteStatus: InviteStatus;
  sentAt: string | null;
  acceptedAt: string | null;
}

export type ProfileWithMission = LinkedInProspectRecord &
  ProfileMissionFields & { metadataJson?: string | null };

export function missionContextForRun(runId?: string): {
  missionId?: string;
  missionName?: string;
  audience?: string;
} {
  if (!runId) return {};
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT id, name, config_json FROM hermes_missions WHERE automation_run_id = ? LIMIT 1`
    )
    .get(runId) as { id: string; name: string; config_json: string } | undefined;
  if (!row) return {};
  let audience = "";
  try {
    audience = (JSON.parse(row.config_json) as { audience?: string }).audience ?? "";
  } catch {
    audience = "";
  }
  return { missionId: row.id, missionName: row.name, audience };
}

function parseMetaFields(metadata_json: string | null): {
  sentAt: string | null;
  acceptedAt: string | null;
} {
  try {
    const meta = JSON.parse(metadata_json || "{}") as Record<string, string | null>;
    return { sentAt: meta.sentAt ?? null, acceptedAt: meta.acceptedAt ?? null };
  } catch {
    return { sentAt: null, acceptedAt: null };
  }
}

type ProfileRow = {
  id: string;
  campaignId: string | null;
  name: string;
  profileUrl: string;
  company: string | null;
  title: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  lastActionAt: string | null;
  metadata_json: string | null;
  missionId: string | null;
  missionName: string | null;
  missionAudience: string | null;
  missionStatus: string | null;
};

function mapProfileRow(r: ProfileRow): ProfileWithMission {
  const meta = parseMetaFields(r.metadata_json);
  return {
    id: r.id,
    campaignId: r.campaignId,
    name: r.name,
    profileUrl: r.profileUrl,
    company: r.company,
    title: r.title,
    location: r.location,
    status: r.status,
    createdAt: r.createdAt,
    lastActionAt: r.lastActionAt,
    missionId: r.missionId,
    missionName: r.missionName,
    missionAudience: r.missionAudience,
    missionStatus: r.missionStatus,
    metadataJson: r.metadata_json,
    inviteStatus: inviteStatusFromProspect(r.status),
    sentAt: meta.sentAt,
    acceptedAt: meta.acceptedAt,
  };
}

const PROFILE_SELECT = `
  SELECT p.id, p.campaign_id as campaignId, p.name, p.profile_url as profileUrl,
         p.company, p.title, p.location, p.status,
         p.created_at as createdAt, p.last_action_at as lastActionAt, p.metadata_json,
         h.id as missionId, h.name as missionName,
         json_extract(h.config_json, '$.audience') as missionAudience,
         h.status as missionStatus
  FROM linkedin_prospects p
  LEFT JOIN hermes_missions h ON (
    h.id = json_extract(p.metadata_json, '$.missionId')
    OR h.automation_run_id = json_extract(p.metadata_json, '$.runId')
  )
`;

export function listProfilesWithMission(missionId?: string): ProfileWithMission[] {
  const db = getAgentDb();
  const rows = missionId
    ? (db
        .prepare(`${PROFILE_SELECT} WHERE h.id = ? ORDER BY p.created_at DESC LIMIT 200`)
        .all(missionId) as ProfileRow[])
    : (db
        .prepare(`${PROFILE_SELECT} ORDER BY p.created_at DESC LIMIT 200`)
        .all() as ProfileRow[]);
  return rows.map(mapProfileRow);
}

export function listMissionProfileGroups(): MissionProfileGroup[] {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT h.id as missionId, h.name as missionName,
              json_extract(h.config_json, '$.audience') as audience,
              h.status, h.automation_run_id as runId,
              COUNT(p.id) as profileCount
       FROM hermes_missions h
       LEFT JOIN linkedin_prospects p ON (
         json_extract(p.metadata_json, '$.missionId') = h.id
         OR json_extract(p.metadata_json, '$.runId') = h.automation_run_id
       )
       GROUP BY h.id
       ORDER BY h.created_at DESC
       LIMIT 40`
    )
    .all() as Array<{
    missionId: string;
    missionName: string;
    audience: string | null;
    status: string;
    runId: string | null;
    profileCount: number;
  }>;

  return rows.map((r) => ({
    missionId: r.missionId,
    missionName: r.missionName,
    audience: r.audience ?? "",
    status: r.status,
    runId: r.runId,
    profileCount: r.profileCount,
  }));
}

export function getProfileWithMission(id: string): ProfileDetailRecord | null {
  const db = getAgentDb();
  const row = db
    .prepare(`${PROFILE_SELECT} WHERE p.id = ?`)
    .get(id) as ProfileRow | undefined;
  if (!row) return null;

  const base = mapProfileRow(row);

  const actions = db
    .prepare(
      `SELECT id, action_type as actionType, status, created_at as createdAt, completed_at as completedAt
       FROM linkedin_actions WHERE prospect_id = ? ORDER BY created_at DESC`
    )
    .all(id) as ProfileDetailRecord["actions"];

  const messages = db
    .prepare(
      `SELECT id, direction, body, status, created_at as createdAt
       FROM linkedin_messages WHERE prospect_id = ? ORDER BY created_at DESC`
    )
    .all(id) as ProfileDetailRecord["messages"];

  const latestDraft = messages.find((m) => m.status === "draft");

  return {
    ...base,
    actions,
    messages,
    draftMessage: latestDraft?.body ?? null,
  };
}
