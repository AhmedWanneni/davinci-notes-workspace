# ADR-0018: Baseline Tauri plugins pre-installed

## Status
Accepted

## Context
Future sessions shouldn't start from zero on plugin setup.

## Decision
Register `tauri-plugin-fs` (with `watch` feature for vault file watching), `tauri-plugin-sql` (SQLite feature for FTS index), and `tauri-plugin-log` (debug builds only) in `src-tauri/src/lib.rs` with default capabilities — not yet wired to app features.

## Consequences
- File watching lives in the fs plugin's `watch` feature, not a separate crate (Tauri v2).
- Plugins available for wiring as features land.
