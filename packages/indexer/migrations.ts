export interface IndexMigration {
  version: number;
  description: string;
  sql: string;
}

export const VAULT_INDEX_MIGRATIONS: readonly IndexMigration[] = [
  {
    version: 1,
    description: "create_notes_and_links_tables",
    sql: `
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
);`,
  },
  {
    version: 2,
    description: "create_settings_table",
    sql: "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
  },
  {
    version: 3,
    description: "create_notes_fts_table",
    sql: "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(path UNINDEXED, content);",
  },
  {
    version: 4,
    description: "create_ai_embedding_chunks_table",
    sql: "CREATE TABLE IF NOT EXISTS embedding_chunks (chunk_id TEXT PRIMARY KEY NOT NULL, note_path TEXT NOT NULL, heading TEXT, start_line INTEGER NOT NULL, end_line INTEGER NOT NULL, content_hash TEXT NOT NULL, model TEXT NOT NULL, vector BLOB NOT NULL, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_embedding_chunks_note ON embedding_chunks(note_path);",
  },
  {
    version: 5,
    description: "retain_ai_embedding_chunk_text",
    sql: "ALTER TABLE embedding_chunks ADD COLUMN text TEXT NOT NULL DEFAULT '';",
  },
  {
    version: 6,
    description: "create_reminders_table",
    sql: "CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, note_path TEXT NOT NULL, line INTEGER NOT NULL, due_at_utc TEXT NOT NULL, tz TEXT NOT NULL, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (note_path) REFERENCES notes(path) ON DELETE CASCADE); CREATE INDEX IF NOT EXISTS idx_reminders_done_due ON reminders(done, due_at_utc); CREATE INDEX IF NOT EXISTS idx_reminders_note_path ON reminders(note_path);",
  },
  {
    version: 7,
    description: "create_reminder_local_state_table",
    sql: "CREATE TABLE IF NOT EXISTS reminder_local_state (reminder_key TEXT PRIMARY KEY NOT NULL, note_path TEXT NOT NULL, due_at_utc TEXT NOT NULL, text TEXT NOT NULL, status TEXT NOT NULL, notified_at INTEGER NOT NULL, snooze_until_utc TEXT, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_reminder_local_status ON reminder_local_state(status);",
  },
  {
    version: 8,
    description: "create_google_calendar_tables",
    sql: "CREATE TABLE IF NOT EXISTS google_calendars (id TEXT PRIMARY KEY NOT NULL, summary TEXT NOT NULL, is_primary INTEGER NOT NULL DEFAULT 0, color TEXT, selected INTEGER NOT NULL DEFAULT 1); CREATE TABLE IF NOT EXISTS google_calendar_events (id TEXT PRIMARY KEY NOT NULL, calendar_id TEXT NOT NULL, title TEXT NOT NULL, start_iso TEXT NOT NULL, end_iso TEXT NOT NULL, is_all_day INTEGER NOT NULL DEFAULT 0, meet_url TEXT, location TEXT, description TEXT, status TEXT NOT NULL DEFAULT 'confirmed', attendees_json TEXT NOT NULL DEFAULT '[]', updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON google_calendar_events(start_iso); CREATE INDEX IF NOT EXISTS idx_calendar_events_cal ON google_calendar_events(calendar_id); CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON google_calendar_events(status); CREATE TABLE IF NOT EXISTS google_calendar_sync_state (calendar_id TEXT PRIMARY KEY NOT NULL, sync_token TEXT NOT NULL, last_synced_at INTEGER NOT NULL);",
  },
  {
    version: 9,
    description: "google_calendar_outbox_and_two_way_sync",
    sql: "ALTER TABLE google_calendar_events ADD COLUMN etag TEXT; ALTER TABLE google_calendar_events ADD COLUMN recurrence_rule TEXT; ALTER TABLE google_calendar_events ADD COLUMN recurring_event_id TEXT; ALTER TABLE google_calendar_events ADD COLUMN original_start_iso TEXT; ALTER TABLE google_calendar_events ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced'; CREATE TABLE IF NOT EXISTS google_calendar_outbox (id TEXT PRIMARY KEY NOT NULL, client_mutation_id TEXT NOT NULL UNIQUE, calendar_id TEXT NOT NULL, event_id TEXT NOT NULL, action TEXT NOT NULL, payload_json TEXT NOT NULL, etag TEXT, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_calendar_outbox_created ON google_calendar_outbox(created_at); CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status ON google_calendar_events(sync_status);",
  },
  {
    version: 10,
    description: "scheduled_messages_and_reminder_channels",
    sql: "ALTER TABLE reminder_local_state ADD COLUMN channels_json TEXT; ALTER TABLE reminder_local_state ADD COLUMN delivery_error TEXT; CREATE TABLE IF NOT EXISTS scheduled_messages (id TEXT PRIMARY KEY NOT NULL, channel_id TEXT NOT NULL, channel_kind TEXT NOT NULL, recipient_label TEXT NOT NULL, message_text TEXT NOT NULL, due_at_utc TEXT NOT NULL, tz TEXT NOT NULL, local_date TEXT NOT NULL, local_time TEXT NOT NULL, recurrence_rule TEXT, allow_mentions INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'scheduled', attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, last_sent_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_due ON scheduled_messages(status, due_at_utc);",
  },
];
