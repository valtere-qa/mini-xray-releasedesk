PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  execution_key TEXT DEFAULT '',
  source_name TEXT DEFAULT '',
  environment TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  test_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  test_type TEXT DEFAULT 'Manual',
  workflow_status TEXT DEFAULT '',
  original_status TEXT NOT NULL DEFAULT 'TO DO',
  local_status TEXT NOT NULL DEFAULT 'TO DO',
  remote_status TEXT,
  sync_status TEXT NOT NULL DEFAULT 'UNCHANGED',
  tester TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  actual_result TEXT DEFAULT '',
  defect TEXT DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  UNIQUE(release_id, test_key)
);

CREATE TABLE IF NOT EXISTS test_steps (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL,
  step_no INTEGER NOT NULL,
  action TEXT DEFAULT '',
  test_data TEXT DEFAULT '',
  expected_result TEXT DEFAULT '',
  actual_result TEXT DEFAULT '',
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  test_case_id TEXT,
  test_key TEXT DEFAULT '',
  field TEXT NOT NULL,
  old_value TEXT DEFAULT '',
  new_value TEXT DEFAULT '',
  note TEXT DEFAULT '',
  actor TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cases_release ON test_cases(release_id);
CREATE INDEX IF NOT EXISTS idx_steps_case ON test_steps(test_case_id);
CREATE INDEX IF NOT EXISTS idx_audit_release ON audit_log(release_id, created_at DESC);
