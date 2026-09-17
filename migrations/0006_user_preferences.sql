PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  accent_color TEXT NOT NULL DEFAULT '#0C66E4',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
