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
  }]
}
