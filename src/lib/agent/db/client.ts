import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync | null = null;
let resolvedDbPath: string | null = null;

/** alysonCRM+ package root (contains package.json + data/). */
function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

function resolveDbPath(): string {
  if (resolvedDbPath) return resolvedDbPath;

  const root = packageRoot();
  const envPath = process.env.ALYSON_AGENT_DB_PATH?.trim();
  if (envPath) {
    resolvedDbPath = path.isAbsolute(envPath) ? envPath : path.join(root, envPath);
    return resolvedDbPath;
  }

  const dataDir = path.join(root, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  resolvedDbPath = path.join(dataDir, "alyson-platform.db");
  return resolvedDbPath;
}

export function getAgentDbPath(): string {
  return resolveDbPath();
}

function ensureSchemaPatches(database: DatabaseSync): void {
  // Incremental patches for DBs created before new tables were added to schema.sql.
  // Safe to run on every request — all statements are idempotent.
  database.exec(`
    CREATE TABLE IF NOT EXISTS hermes_missions (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL DEFAULT 'org-default',
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      config_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      automation_run_id TEXT,
      result_summary TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (automation_run_id) REFERENCES automation_runs(id)
    );
    CREATE INDEX IF NOT EXISTS idx_hermes_missions_status ON hermes_missions(status);
    CREATE INDEX IF NOT EXISTS idx_hermes_missions_created ON hermes_missions(created_at DESC);
  `);
}

function loadSchema(database: DatabaseSync): void {
  const schemaPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "schema.sql"
  );
  database.exec(fs.readFileSync(schemaPath, "utf8"));

  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT OR IGNORE INTO organization_settings (id, name, settings_json, created_at, updated_at)
       VALUES ('org-default', 'Default Organization', '{}', ?, ?)`
    )
    .run(now, now);
}

export function getAgentDb(): DatabaseSync {
  if (db) {
    ensureSchemaPatches(db);
    return db;
  }
  const dbPath = resolveDbPath();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[agent-db] using ${dbPath}`);
  }
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  loadSchema(db);
  ensureSchemaPatches(db);
  return db;
}

export function nowIso(): string {
  return new Date().toISOString();
}
