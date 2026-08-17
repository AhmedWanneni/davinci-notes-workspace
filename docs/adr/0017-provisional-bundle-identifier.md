# ADR-0017: Provisional desktop bundle identifier

## Status
Accepted

## Context
No bundle ID was documented in repo docs when scaffolding `apps/desktop`.

## Decision
Use `com.davinci.notes`, derived from the workspace name, as a provisional identifier. **Confirm or replace before any App Store / notarization work.**

## Consequences
- Change lives in `apps/desktop/src-tauri/tauri.conf.json` → `identifier`.
- Currently an open item (see `PROGRESS.md` Blocked).
