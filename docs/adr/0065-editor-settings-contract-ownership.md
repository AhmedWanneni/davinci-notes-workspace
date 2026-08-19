# ADR-0065: Editor settings contract belongs to `@app/editor`

## Status
Accepted

## Context
The desktop store previously defined editor font values, Strict Line Breaks defaults, valid-value handling, and serialization alongside its SQLite implementation. That made the shared editor package lack ownership of its own settings contract and left another client vulnerable to using different defaults or values.

## Decision
- `@app/editor` owns the `EditorSettings` schema, editor-font values, defaults, validation, and storage-neutral load/save helpers.
- Desktop owns only the vault SQLite adapter and Zustand bindings. It passes the existing settings table through the editor package's `EditorSettingsStorage` contract.
- Settings load performs one `getSetting` query at a time through the existing lock. Explicit setting writes continue to use the same lock.
- The desktop settings dialog consumes the editor package's allowed font list and validation rather than maintaining a duplicate list.
- Strict Line Breaks keeps the rendering semantics established in ADR-0063; this decision changes ownership and validation only, not Markdown rendering behavior.

## Consequences
- Desktop and future clients, including mobile, share one settings vocabulary without importing SQLite, Tauri, or Zustand into `@app/editor`.
- No dependency, initial-bundle, or per-keystroke cost is added. Settings access remains only on load or explicit user changes.
- Invalid persisted font values fall back to the editor package default instead of becoming untyped UI state.
- Settings initialization does not issue concurrent SQLite statements; each read is serialized with other JavaScript-side database writes.
