-- Vault index schema (shared between desktop and mobile).
-- Applied via tauri-plugin-sql migration in apps/desktop/src-tauri/src/db.rs.

CREATE TABLE IF NOT EXISTS notes (
  path TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  frontmatter TEXT NOT NULL DEFAULT '{}',
  mtime INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  path TEXT NOT NULL,
  tag_key TEXT NOT NULL,
  tag_display TEXT NOT NULL,
  PRIMARY KEY (path, tag_key),
  FOREIGN KEY (path) REFERENCES notes(path) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_key);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  target_raw TEXT NOT NULL,
  display_text TEXT,
  heading TEXT,
  block_id TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (source_path) REFERENCES notes(path) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_path);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
