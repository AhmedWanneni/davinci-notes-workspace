# ADR-0153: Automatic local versions batch recently saved Markdown notes

## Status

Accepted

## Context

Phase 1 turns the Phase 0 local repository into usable local history without a
history UI or a remote. ADR-0037 establishes the project precedent: rapid
changes are bounded and batched before persistence rather than doing expensive
work synchronously per event. The editor already debounces disk writes by 750
ms per note.

## Decision

1. A successful Markdown save records its path with a 2,000 ms trailing-edge
   version batch. This is deliberately after the existing 750 ms save debounce,
   never in `updateNoteContent`, and follows ADR-0037's bounded batch
   discipline.
2. One commit contains all Markdown notes saved in that 2-second window. This
   is more readable than one commit per file during a bulk edit while keeping
   a narrow, time-local history unit for Phase 2.
3. Automatic commit messages are `Auto-save: <path>` for one note and
   `Auto-save: <count> notes: <path>, <path>` for a batch. The Command Palette
   exposes `Save version now`; it flushes the current batch immediately with
   the distinct `Saved version: <path>` message.
4. The TypeScript scheduler dynamically loads only after a completed save and
   invokes an async Tauri command. The native command performs the filesystem
   Git work in `spawn_blocking` and serializes the full initialize/stage/check/
   commit operation with one Git-operation mutex. Thus typing and state updates
   do not await Git.
5. This supersedes ADR-0152's Phase 0 default-off activation assumption only:
   the first saved note automatically initializes local history. ADR-0152's
   system-Git engine, no-remote policy, ignore policy, and zero startup Git
   engine payload remain unchanged.
6. Commit/version metadata stays in Git's `.git` directory. Phase 1 makes no
   `vault-index.db` read or write, so no additional `withDbLock` operation or
   migration is needed.

## Verification

- No dependency was added. The production entry changed from 368,090 raw /
  116,570 gzip bytes to 368,710 raw / 116,740 gzip bytes: **+620 raw / +170
  gzip bytes** for the dynamic-import bootstrap only. The scheduler and native
  invoke adapter remain separate deferred chunks (1,240 raw / 600 gzip and 160
  raw / 150 gzip bytes respectively), fetched after a save rather than at
  first paint.
- Focused Rust tests directly created a fresh repository, a one-commit
  two-file auto-save batch (`Auto-save: 2 notes: one.md, two.md`), and a
  distinct manual commit (`Saved version: note`); `git log` was inspected in
  each test.
- Scheduler tests verify nearby saves flush as one automatic operation and the
  manual action flushes immediately.
- The adversarial Node test edited a 2.1 MB Markdown note and ran real local
  `git add` plus `git commit` while measuring the JavaScript event loop. The
  maximum input-loop latency was **1.00 ms**, below the 50 ms threshold; total
  add/commit test duration was 111 ms.

## Consequences

Phase 2 can present the resulting useful, grouped messages directly in history
and diff UI. Remote configuration, credentials, fetch, push, pull, and all
other network behavior remain out of scope.
