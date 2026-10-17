# ADR-0182: Reminder syntax, parsing scope, and SQLite storage model

## Status

Accepted

## Context

Phase 1 of reminders requires a durable, local-first reminder specification for Markdown notes in DaVinci Notes. Reminders must integrate into the existing `@app/indexer` pipeline, update incrementally through file watcher batches and editor saves, and persist to `vault-index.db` under the project's standing SQLite discipline (universal `withDbLock` serialization, batched writes, connection-time WAL mode).

Four open decisions required resolution:
1. **Token Syntax**: How reminders are expressed inline in notes.
2. **V1 Scope**: What document elements can carry reminders (tasks only vs any line).
3. **Time Storage**: Format and precision for due instants in SQLite.
4. **Date-Only Default**: How reminders lacking an explicit time are interpreted.

## Decision

### 1. Token Syntax: Obsidian Reminder Standard `(@YYYY-MM-DD[ HH:mm[:ss]])`
Adopt the Obsidian Reminder community ecosystem standard `(@YYYY-MM-DD)` with optional time `(@YYYY-MM-DD HH:mm)` or `(@YYYY-MM-DD HH:mm:ss)`.
- *Rationale*: Enclosing parentheses with `@` (`(@...)`) prevent collisions with user mentions (`@user`) and email addresses (`name@example.com`).
- *Alternative rejected*: Tasks emoji format (`📅 YYYY-MM-DD`, `⏰ HH:mm`) requires multi-token parsing, is awkward on desktop keyboards, and clashes with other task emoji annotations. Freeform `@remind(...)` is non-standard in existing Obsidian vaults.

### 2. V1 Scope: Markdown Task Checklist Items Only
In v1, reminders are recognized only on Markdown checklist items (`- [ ]`, `- [x]`, `* [ ]`, `* [x]`, `+ [ ]`, `+ [x]`, `1. [ ]`, `1. [x]`).
- *Rationale*: Reminders represent actionable items with explicit completion states. Toggling the task checkbox (`[ ]` vs `[x]` / `[X]` / `[-]`) provides the durable source of truth for completion (`done`). Scoping to task items satisfies the requirement that checking the box marks the reminder done and removes it from upcoming queries. Non-task lines with reminder tokens are ignored in v1.
- *Task Text Normalization*: The stored `text` extracts the task description with checkbox prefix and reminder token stripped, collapsing internal whitespace.

### 3. Time Storage: ISO-8601 UTC String (`due_at_utc`) + Timezone String (`tz`)
Store `due_at_utc TEXT NOT NULL` formatted as ISO-8601 UTC string (`YYYY-MM-DDTHH:mm:ss.sssZ`) alongside user timezone `tz TEXT NOT NULL` (e.g. `Europe/London`, `America/New_York`, or `UTC`).
- *Rationale*: In SQLite, ISO-8601 UTC strings sort lexicographically identical to chronological order, enabling direct index range scans (`WHERE due_at_utc >= ?`). Strings are human-readable during database inspection and preserve millisecond precision without integer overflow or epoch ambiguity across platforms. Storing `tz` alongside preserves local user intent across daylight saving changes.
- *Schema*:
  ```sql
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_path TEXT NOT NULL,
    line INTEGER NOT NULL,
    due_at_utc TEXT NOT NULL,
    tz TEXT NOT NULL,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (note_path) REFERENCES notes(path) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_reminders_done_due ON reminders(done, due_at_utc);
  CREATE INDEX IF NOT EXISTS idx_reminders_note_path ON reminders(note_path);
  ```

### 4. Date-Only Default: 09:00:00 Local Morning Time
When a reminder specifies only a date (e.g. `(@2026-10-15)`), the due time defaults to `09:00:00` (9:00 AM) in the local timezone, converted to UTC.
- *Rationale*: A `00:00:00` (midnight) default causes date-only reminders to be marked overdue the moment the user wakes up on that date. A `23:59:59` default prevents morning/daytime visibility. 09:00 AM matches Apple Reminders, Google Tasks, and the Obsidian Reminder default setting.

### 5. Masking and Parsing Resilience
- `parseReminders` ignores reminder tokens inside fenced code blocks (` ``` ` or `~~~`), inline code spans (`` `...` ``), and YAML frontmatter (`^---\n...\n---`).
- Masking preserves newline and character offsets so 1-based `line` indices accurately match file lines.
- Malformed dates (e.g. `2026-02-31`, `2026-13-45`) and malformed times are safely rejected without throwing exceptions.
- Early exit optimization: files without `(@` exit immediately with zero allocation (< 0.001 ms).

### 6. Index Lifecycle and Lock Discipline
- SQLite operations run under Migration v6 in `apps/desktop/src-tauri/src/db.rs`.
- Reminders are wiped and repopulated per-note via `replaceRemindersBatch` inside `persistNotesBatch`, and removed via `removeRemindersBatch` inside `removeNotesBatch`.
- All reads and writes serialize strictly through `withDbLock` per ADR-0168.

## Consequences

- Zero new runtime packages added: pure TypeScript parser using platform `Intl.DateTimeFormat` / `Date` APIs (0 KB bundle cost).
- Full index rebuilds and watcher reconciliations maintain consistent reminder rows.
- Toggling a task checkbox in CodeMirror flips `done` on save/reconcile, instantly removing it from upcoming queries.
