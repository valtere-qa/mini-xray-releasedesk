-- Persistente Testfall-Timer und automatisch erfasste Testdurchführungszeit.
ALTER TABLE test_cases ADD COLUMN timer_started_at TEXT;
ALTER TABLE test_cases ADD COLUMN execution_time_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE test_cases ADD COLUMN last_executed_at TEXT;
