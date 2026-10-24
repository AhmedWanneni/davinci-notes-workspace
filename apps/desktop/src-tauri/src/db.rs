use tauri_plugin_sql::{Migration, MigrationKind};

/// SQLite connection string for the vault index database.
pub const DB_URL: &str = "sqlite:vault-index.db";

/// Schema lives in the shared indexer package — single source of truth for desktop + mobile.
pub const SCHEMA_SQL: &str = include_str!("../../../../packages/indexer/schema.sql");

/// Versioned migrations registered with tauri-plugin-sql.
pub fn migrations() -> Vec<Migration> {
  vec![Migration {
    version: 1,
    description: "create_notes_and_links_tables",
    sql: SCHEMA_SQL,
    kind: MigrationKind::Up,
  },
  Migration {
    version: 2,
    description: "create_settings_table",
    sql: "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 3,
    description: "create_notes_fts_table",
    sql: "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(path UNINDEXED, content);",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 4,
    description: "create_ai_embedding_chunks_table",
    sql: "CREATE TABLE IF NOT EXISTS embedding_chunks (chunk_id TEXT PRIMARY KEY NOT NULL, note_path TEXT NOT NULL, heading TEXT, start_line INTEGER NOT NULL, end_line INTEGER NOT NULL, content_hash TEXT NOT NULL, model TEXT NOT NULL, vector BLOB NOT NULL, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_embedding_chunks_note ON embedding_chunks(note_path);",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 5,
    description: "retain_ai_embedding_chunk_text",
    sql: "ALTER TABLE embedding_chunks ADD COLUMN text TEXT NOT NULL DEFAULT '';",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 6,
    description: "create_reminders_table",
    sql: "CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, note_path TEXT NOT NULL, line INTEGER NOT NULL, due_at_utc TEXT NOT NULL, tz TEXT NOT NULL, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (note_path) REFERENCES notes(path) ON DELETE CASCADE); CREATE INDEX IF NOT EXISTS idx_reminders_done_due ON reminders(done, due_at_utc); CREATE INDEX IF NOT EXISTS idx_reminders_note_path ON reminders(note_path);",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 7,
    description: "create_reminder_local_state_table",
    sql: "CREATE TABLE IF NOT EXISTS reminder_local_state (reminder_key TEXT PRIMARY KEY NOT NULL, note_path TEXT NOT NULL, due_at_utc TEXT NOT NULL, text TEXT NOT NULL, status TEXT NOT NULL, notified_at INTEGER NOT NULL, snooze_until_utc TEXT, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_reminder_local_status ON reminder_local_state(status);",
    kind: MigrationKind::Up,
  },
  Migration {
    version: 8,
    description: "create_google_calendar_tables",
    sql: "CREATE TABLE IF NOT EXISTS google_calendars (id TEXT PRIMARY KEY NOT NULL, summary TEXT NOT NULL, is_primary INTEGER NOT NULL DEFAULT 0, color TEXT, selected INTEGER NOT NULL DEFAULT 1); CREATE TABLE IF NOT EXISTS google_calendar_events (id TEXT PRIMARY KEY NOT NULL, calendar_id TEXT NOT NULL, title TEXT NOT NULL, start_iso TEXT NOT NULL, end_iso TEXT NOT NULL, is_all_day INTEGER NOT NULL DEFAULT 0, meet_url TEXT, location TEXT, description TEXT, status TEXT NOT NULL DEFAULT 'confirmed', attendees_json TEXT NOT NULL DEFAULT '[]', updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON google_calendar_events(start_iso); CREATE INDEX IF NOT EXISTS idx_calendar_events_cal ON google_calendar_events(calendar_id); CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON google_calendar_events(status); CREATE TABLE IF NOT EXISTS google_calendar_sync_state (calendar_id TEXT PRIMARY KEY NOT NULL, sync_token TEXT NOT NULL, last_synced_at INTEGER NOT NULL);",
    kind: MigrationKind::Up,
  }]
}
