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
  }]
}
