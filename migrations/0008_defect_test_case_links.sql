CREATE TABLE IF NOT EXISTS defect_test_cases (
  defect_id TEXT NOT NULL,
  test_case_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (defect_id, test_case_id),
  FOREIGN KEY (defect_id) REFERENCES defects(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO defect_test_cases (defect_id, test_case_id, created_at)
SELECT id, test_case_id, created_at
FROM defects;

CREATE INDEX IF NOT EXISTS idx_defect_test_cases_case
  ON defect_test_cases(test_case_id, defect_id);
