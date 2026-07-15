-- Alyson CRM+ Agent Platform schema (SQLite)

CREATE TABLE IF NOT EXISTS organization_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS desktop_agents (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  device_token_hash TEXT NOT NULL,
  last_seen_at TEXT,
  paired_at TEXT,
  revoked_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_pairings (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  device_id TEXT,
  created_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pairings_code ON device_pairings(code);

CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS browser_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  profile_name TEXT NOT NULL DEFAULT 'Alyson Chrome Profile',
  status TEXT NOT NULL DEFAULT 'idle',
  current_url TEXT,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  device_id TEXT,
  user_prompt TEXT NOT NULL,
  plan_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  risk_level TEXT NOT NULL DEFAULT 'low',
  result_summary TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS automation_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_json TEXT,
  output_json TEXT,
  screenshot_path TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (run_id) REFERENCES automation_runs(id)
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT,
  tool TEXT NOT NULL,
  status TEXT NOT NULL,
  args_json TEXT,
  result_json TEXT,
  screenshot TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES automation_runs(id)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY (run_id) REFERENCES automation_runs(id)
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT,
  device_id TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkedin_accounts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  label TEXT NOT NULL,
  profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkedin_campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  name TEXT NOT NULL,
  target_audience TEXT,
  linkedin_account_id TEXT,
  sequence_json TEXT NOT NULL DEFAULT '[]',
  daily_limit INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkedin_prospects (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  name TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  company TEXT,
  title TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  last_action_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES linkedin_campaigns(id)
);

CREATE TABLE IF NOT EXISTS linkedin_messages (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (prospect_id) REFERENCES linkedin_prospects(id)
);

CREATE TABLE IF NOT EXISTS linkedin_actions (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requires_approval INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (prospect_id) REFERENCES linkedin_prospects(id)
);

CREATE TABLE IF NOT EXISTS linkedin_conversations (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL,
  messages_json TEXT NOT NULL DEFAULT '[]',
  sentiment TEXT,
  reply_status TEXT NOT NULL DEFAULT 'none',
  owner TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prospect_id) REFERENCES linkedin_prospects(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  actor TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  scope TEXT NOT NULL,
  rules_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-default',
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(org_id, kind, key);

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
