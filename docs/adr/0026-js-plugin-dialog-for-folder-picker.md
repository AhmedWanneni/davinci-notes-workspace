# ADR-0026: Vault folder picker uses the JS dialog plugin

## Status
Accepted

## Context
Rust `blocking_pick_folder()` inside a sync Tauri command froze the entire app on macOS (main-thread block).

## Decision
`open_vault` accepts a **path string only**. Folder selection uses `@tauri-apps/plugin-dialog` `open({ directory: true })` in the webview (`pickVaultFolder.ts`).

## Consequences
- No main-thread blocking during folder selection.
- Watcher starts **after** initial index completes; watcher events are suppressed/paused during index + reconcile to prevent read→event→reindex loops.
