-- Browser Agent SQLite schema

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  starting_url TEXT NOT NULL,
  objective TEXT NOT NULL,
  extraction_schema_json TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  model TEXT NOT NULL,
  current_url TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  max_iterations INTEGER NOT NULL,
  budget_usd REAL NOT NULL,
  spent_usd REAL NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  crm_endpoint TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  user_request TEXT,
  model TEXT,
  tool_name TEXT,
  tool_args_sanitized TEXT,
  result_summary TEXT,
  url TEXT,
  ts TEXT NOT NULL,
  approval_status TEXT,
  error TEXT,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_run ON audit_events(run_id);

CREATE TABLE IF NOT EXISTS extracted_records (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  page_title TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  selectors_json TEXT,
  approval TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE INDEX IF NOT EXISTS idx_records_run ON extracted_records(run_id);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_args_json TEXT NOT NULL,
  operation_class TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);
