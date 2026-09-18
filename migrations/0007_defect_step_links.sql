CREATE TABLE IF NOT EXISTS defect_test_steps (
  defect_id TEXT NOT NULL,
  test_step_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (defect_id, test_step_id),
  FOREIGN KEY (defect_id) REFERENCES defects(id) ON DELETE CASCADE,
  FOREIGN KEY (test_step_id) REFERENCES test_steps(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO defect_test_steps (defect_id, test_step_id, created_at)
SELECT id, test_step_id, created_at
FROM defects
WHERE test_step_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_defect_test_steps_step
  ON defect_test_steps(test_step_id, defect_id);
