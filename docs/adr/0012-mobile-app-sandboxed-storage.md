# ADR-0012: Mobile storage is app-sandboxed, not arbitrary folder access

## Status
Accepted

## Context
iOS/Android don't allow desktop-style folder access.

## Decision
On mobile the vault lives in app-private storage; all external changes arrive through the sync client, not a filesystem watcher.

## Consequences
- Desktop uses a filesystem watcher (sync clients like iCloud/Dropbox can write directly into a folder there); mobile cannot.
- Mobile always goes through the sync client for external changes.
