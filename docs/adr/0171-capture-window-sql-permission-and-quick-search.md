# ADR-0171: Capture Window SQL Permission and Quick Search

## Status

Accepted (modifies capture capability isolation from Phase 0/4)

## Context

Phase 5 introduces quick search from the capture window. The user can switch to a search mode to find notes by title or content and immediately jump to them in the main window.

The architectural tension:
- The capture window was established in Phase 0/4 as an isolated least-privilege window with a tiny entry point (`dist/assets/capture-*.js`), no filesystem access, and no SQL permissions.
- In DaVinci Notes, full-text search and BM25 ranking are implemented in the `@app/indexer` TypeScript package (`executeSearchQuery` / `parseSearchQuery`) operating over SQLite (`vault-index.db`, FTS5 `notes_fts` table). Rust acts as I/O only.
- Proxying queries through the main window (Option A) creates tight runtime coupling: if the main window is hidden, throttled, or busy, search queries in the capture window could lag, time out, or require complex request/response correlation and cancellation protocols.
- Implementing a parallel SQLite/FTS5 ranking engine in Rust (Option B) introduces duplicated query syntax, ranking, and tokenization logic that inevitably drifts from the in-app quick switcher, as well as adding binary weight.

## Decision

1. **Grant Scoped SQL Permissions to Capture Window (Option C)**:
   Add `"sql:default"` and `"sql:allow-execute"` to `capabilities/capture.json`.
   The capture window uses `@tauri-apps/plugin-sql` and the shared `@app/indexer` search functions (`executeSearchQuery`, `parseSearchQuery`) directly.

2. **Read-Only SQLite Access under WAL Mode**:
   `vault-index.db` is opened with `journal_mode=WAL` and `busy_timeout=5000`.
   The capture window performs read-only `SELECT` queries on `notes` and `notes_fts`.
   Under SQLite WAL mode, readers do not block writers and writers do not block readers, preventing `SQLITE_BUSY` errors even while the main window is indexing or syncing.

3. **Reuse Single Canonical Ranking & Parsing**:
   The capture window reuses the exact same `parseSearchQuery` and `executeSearchQuery` from `@app/indexer`.
   Query strings are safely sanitized with `quoteFtsValue` (FTS5 phrase escaping) and SQLite parameterized bindings (`$1`), eliminating SQL and FTS syntax injection.

4. **Main Window Navigation via Rust Command**:
   Opening a search result invokes the native command `open_note_from_capture(path)`.
   Rust enforces least-privilege window authorization (`authorize_capture_window`), verifies that `path` is within the active vault root (`validate_recent_note_path`), focuses the main window (`show_main_window`), and emits `davinci-tray-open-note`.

5. **Search UI Lifecycle and State Isolation**:
   - Mode switching: The user can toggle between Capture and Search. Typed capture text is preserved across switches and Escape events.
   - Debounced queries: Queries are debounced (150ms) with stale-result token cancellation so only the latest query's results are rendered.
   - Lifecycle cleanup: Search query and results are cleared when the capture window hides or is dismissed.

## Consequences

- The capture window bundle includes `@tauri-apps/plugin-sql` and `@app/indexer` search execution. Bundle size increases by ~8-10 KB gzip, which remains well below initial load budgets and far lighter than the main bundle.
- Quick search results are 100% consistent with the in-app quick switcher (identical BM25 ranking and query syntax).
- Zero IPC proxy lag or dependency on the main webview's execution state.
- Rust retains strict boundary control over filesystem and window activation.
