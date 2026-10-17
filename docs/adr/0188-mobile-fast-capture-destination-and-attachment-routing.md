# ADR-0188: Mobile Fast Capture Destination and Attachment Routing

## Status

Accepted

## Context

Mobile fast capture enables users to capture thoughts, web links, images, photos, and voice memos into DaVinci Notes in seconds, via:
1. System OS Share Sheet (from browsers, photo gallery, reading apps) while the app is closed, backgrounded, or active.
2. Home screen shortcuts and widgets ("New note" and "Today's note").
3. In-editor quick capture toolbar actions (Camera, Photo Library, Voice Recording).

We must explicitly decide:
- Where shared and captured items land (Inbox note vs new standalone note vs today's daily note).
- Attachment folder placement, naming, and collision resolution rules (aligning with desktop attachment ADRs).
- Indexing and concurrency rules (conforming to SQLite `withDbLock`).

## Decision

### 1. Shared & Captured Item Destination
We evaluated three capture routing models:
- **Option A (Single `Inbox.md` append)**: Appending all captures to a single monolithic file risks write races during background shares and merge conflicts if `Inbox.md` is currently open in the editor.
- **Option B (Today's Daily Note append)**: Appending to `daily/YYYY-MM-DD.md` mixes transient clippings with reflective journaling, and forces daily note creation for users who do not use daily notes.
- **Option C (Default: Standalone Note in `Quick Notes/` — Recommended)**: Creates an independent note in `Quick Notes/` named `Quick note YYYY-MM-DD HH-mm-ss.md` (or derived from page title / URL domain).

**Decision**:
1. Default destination is **Option C: Standalone Note in `Quick Notes/`**, mirroring desktop quick capture (ADR-0180). Each capture is an isolated, atomic file with zero write collision risk.
2. To support diverse user workflows, the destination is **configurable** via settings:
   - `"quick-notes"` (default): `Quick Notes/Quick note YYYY-MM-DD HH-mm-ss.md`
   - `"inbox"`: Appends `- [YYYY-MM-DD HH:mm:ss] <content>` to `Inbox.md`
   - `"daily"`: Appends under `## Quick Capture` in `daily/YYYY-MM-DD.md`

### 2. Attachment Folder & Naming Rules (ADR-0108 / ADR-0109 / ADR-0110 Parity)
- **Folder**: All media assets land in the vault's `Attachments/` folder at the root (created automatically on first write).
- **Naming Conventions**:
  - Shared images with original names: preserves sanitized original name (e.g., `diagram.png`).
  - Camera photos: `capture-YYYYMMDD-HHmmss.jpg`.
  - Audio voice recordings: `audio-YYYYMMDD-HHmmss.m4a`.
- **Collision Resolution (ADR-0110)**:
  - If `Attachments/capture-20261016-170000.jpg` exists, appends numeric suffix before extension: `capture-20261016-170000 1.jpg`, `capture-20261016-170000 2.jpg`. Never overwrites.
- **Markdown Embed Syntax**:
  - Notes reference attachments via desktop-compatible wikilink syntax: `![[Attachments/filename.ext]]` (or `![[filename.ext]]`).

### 3. Concurrency & Offline Independence
- Captures execute directly against `MobileVaultStorageAdapter` using atomic writes (`atomicWriteNote`).
- Incremental SQLite index updates run strictly through `withDbLock`.
- Captures succeed whether the app was previously running, backgrounded, or launched from a cold state.

## Consequences

- Full parity with desktop attachment naming and collision handling.
- Zero data loss from concurrent or rapid background shares.
- Captured items are immediately searchable via FTS5 and visible in file navigation.
