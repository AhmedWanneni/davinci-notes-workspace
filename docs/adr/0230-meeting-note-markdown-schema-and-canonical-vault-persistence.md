# ADR-0230: Meeting Note Markdown Schema & Canonical Vault Persistence

## Status

Accepted

## Context

Notes produced by the Meeting Recorder must integrate seamlessly into the user's vault. They must participate in backlink indexing, tag search, graph view visualization, reminders indexing, and sync services (Google Drive / Syncthing) without requiring special treatment or proprietary file formats.

## Decision

1. **Standard Markdown Representation**:
   - Meeting notes are standard `.md` files saved by default into `Meetings/YYYY-MM-DD - {Title}.md` (or the user-configured destination folder).
   - Notes include standard YAML frontmatter:
     ```yaml
     ---
     type: meeting
     date: YYYY-MM-DD HH:mm
     title: "Sprint Planning"
     attendees: ["Alice", "Bob"]
     tags: ["meeting", "work"]
     ---
     ```
   - Body contains standardized sections:
     - `## Summary`
     - `## Key Decisions`
     - `## Action Items` (formatted with actionable `- [ ] Task (@YYYY-MM-DD)`)
     - `## Raw Transcript` (collapsible or appended at end)

2. **Canonical Vault Write Pipeline**:
   - The note is written exclusively through `createNoteInVault` and `appendToNoteInVault` in `apps/desktop/src/vault/vaultCommands.ts`.
   - All disk writes are atomic (temp file + rename), serialized via `queuePerPath`, notify the file watcher suppression guard (`withVaultWatchSuppressed`), and trigger immediate indexer updates with `withDbLock`.

3. **Crash Recovery**:
   - During an active recording, transcript chunks and draft note state are journaled to `.davinci/recovery/active-meeting.json` every 15 seconds.
   - If the application crashes or the system shuts down abruptly, launching the app detects the journal and offers 1-click recovery of the meeting note.

## Consequences

- Full compatibility with Graph view, Backlinks, Tags, and Sync engines.
- Tasks in action items automatically appear in Reminders view and calendar sync.
- Resilience against crashes during long meetings.
