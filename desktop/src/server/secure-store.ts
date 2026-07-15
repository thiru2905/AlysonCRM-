import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const STORE_DIR = path.join(os.homedir(), ".alyson-agent");
const STORE_FILE = path.join(STORE_DIR, "credentials.json");

export interface DeviceCredentials {
  deviceId: string;
  deviceToken: string;
  crmUrl: string;
  pairedAt: string;
}

export function loadCredentials(): DeviceCredentials | null {
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    return JSON.parse(raw) as DeviceCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: DeviceCredentials): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function clearCredentials(): void {
  if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
}
