PRAGMA foreign_keys = ON;

ALTER TABLE releases ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN revision TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN start_date TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN end_date TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN plan_id TEXT;

ALTER TABLE test_cases ADD COLUMN precondition TEXT NOT NULL DEFAULT '';
ALTER TABLE test_cases ADD COLUMN requirement_key TEXT NOT NULL DEFAULT '';
ALTER TABLE test_cases ADD COLUMN labels TEXT NOT NULL DEFAULT '';
ALTER TABLE test_cases ADD COLUMN component TEXT NOT NULL DEFAULT '';
ALTER TABLE test_cases ADD COLUMN priority TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE test_cases ADD COLUMN folder_path TEXT NOT NULL DEFAULT '';

ALTER TABLE test_steps ADD COLUMN status TEXT NOT NULL DEFAULT 'TO DO';
ALTER TABLE test_steps ADD COLUMN comment TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS test_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, plan_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  release_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  test_step_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  data_base64 TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (test_step_id) REFERENCES test_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS defects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  release_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  test_step_id TEXT,
  defect_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'Major',
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (test_step_id) REFERENCES test_steps(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_user ON test_plans(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(test_case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_step ON evidence(test_step_id);
CREATE INDEX IF NOT EXISTS idx_defects_release ON defects(release_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_defects_case ON defects(test_case_id);
