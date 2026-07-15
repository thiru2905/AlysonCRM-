import { randomBytes, createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { getAgentDb, nowIso } from "../db/client";
import type { DesktopAgentRecord } from "../types";

const PAIRING_TTL_MS = 5 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

export function createPairingCode(orgId = "org-default"): {
  code: string;
  expiresAt: string;
} {
  const db = getAgentDb();
  const code = generateCode();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();
  db.prepare(
    `INSERT INTO device_pairings (id, org_id, code, status, expires_at, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`
  ).run(uuidv4(), orgId, code, expiresAt, now);
  return { code, expiresAt };
}

export function exchangePairingCode(input: {
  code: string;
  name: string;
  platform: string;
  version?: string;
}): { deviceId: string; deviceToken: string } {
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT id, status, expires_at FROM device_pairings WHERE code = ? COLLATE NOCASE`
    )
    .get(input.code.trim().toUpperCase()) as
    | { id: string; status: string; expires_at: string }
    | undefined;

  if (!row) throw new Error("Invalid pairing code.");
  if (row.status !== "pending") throw new Error("Pairing code already used.");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error("Pairing code expired.");
  }

  const deviceId = uuidv4();
  const deviceToken = `adt_${randomBytes(24).toString("hex")}`;
  const now = nowIso();

  db.prepare(
    `INSERT INTO desktop_agents (
      id, org_id, name, platform, version, status, device_token_hash,
      last_seen_at, paired_at, metadata_json, created_at, updated_at
    ) VALUES (?, 'org-default', ?, ?, ?, 'connected', ?, ?, ?, '{}', ?, ?)`
  ).run(
    deviceId,
    input.name,
    input.platform,
    input.version ?? null,
    hashToken(deviceToken),
    now,
    now,
    now,
    now
  );

  db.prepare(
    `UPDATE device_pairings SET status = 'consumed', device_id = ?, consumed_at = ? WHERE id = ?`
  ).run(deviceId, now, row.id);

  db.prepare(
    `INSERT INTO audit_logs (org_id, actor, action, resource_type, resource_id, details_json, created_at)
     VALUES ('org-default', 'desktop', 'device.paired', 'desktop_agent', ?, ?, ?)`
  ).run(deviceId, JSON.stringify({ name: input.name, platform: input.platform }), now);

  return { deviceId, deviceToken };
}

export function validateDeviceToken(
  deviceId: string,
  deviceToken: string
): boolean {
  const db = getAgentDb();
  const row = db
    .prepare(
      `SELECT device_token_hash, revoked_at FROM desktop_agents WHERE id = ?`
    )
    .get(deviceId) as { device_token_hash: string; revoked_at: string | null } | undefined;
  if (!row || row.revoked_at) return false;
  return row.device_token_hash === hashToken(deviceToken);
}

export function recordHeartbeat(deviceId: string, status: string, payload?: unknown): void {
  const db = getAgentDb();
  const now = nowIso();
  db.prepare(
    `INSERT INTO agent_heartbeats (device_id, status, payload_json, created_at) VALUES (?, ?, ?, ?)`
  ).run(deviceId, status, payload ? JSON.stringify(payload) : null, now);
  db.prepare(
    `UPDATE desktop_agents SET status = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`
  ).run(status, now, now, deviceId);
}

export function listDesktopAgents(): DesktopAgentRecord[] {
  const db = getAgentDb();
  return db
    .prepare(
      `SELECT id, name, platform, version, status, last_seen_at as lastSeenAt, paired_at as pairedAt
       FROM desktop_agents WHERE revoked_at IS NULL ORDER BY paired_at DESC`
    )
    .all() as DesktopAgentRecord[];
}

export function getPrimaryDeviceStatus(): {
  status: string;
  device: DesktopAgentRecord | null;
} {
  const devices = listDesktopAgents();
  const connected = devices.find((d) => d.status === "connected");
  if (connected) return { status: "connected", device: connected };
  if (devices.length) return { status: "disconnected", device: devices[0] };
  return { status: "not_installed", device: null };
}
