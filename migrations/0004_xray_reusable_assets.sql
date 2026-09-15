PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS preconditions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  precondition_key TEXT NOT NULL,
  name TEXT NOT NULL,
  condition_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, precondition_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  set_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, set_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_case_preconditions (
  test_case_id TEXT NOT NULL,
  precondition_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (test_case_id, precondition_id),
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (precondition_id) REFERENCES preconditions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_set_tests (
  test_set_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (test_set_id, test_case_id),
  FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_preconditions_user ON preconditions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_sets_user ON test_sets(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_preconditions_case ON test_case_preconditions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_set_tests_set ON test_set_tests(test_set_id);
