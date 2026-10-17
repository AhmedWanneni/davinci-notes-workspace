# ADR-0177: Clipped notes are written through the canonical vault write path

## Status

Proposed (needs owner input, see "Open decisions"). Draft only; no code.

## Context

A clipped note is a note. If it is written by a private side channel it will miss
the file tree, the indexer, backlinks, tags, and (future) sync unless something
else happens to notice the file. This project has a documented single write path
(ADR-0058, ADR-0060): `createNoteInVault` → `writeNote` (`write_note` IPC,
atomic temp+rename) → workspace state update → background indexing through
`withDbLock` + `withDbTransaction` (ADR-0168), wrapped in
`withVaultWatchSuppressed` to avoid a watcher double-index. Rust owns vault I/O
only (`resolve_in_vault` confinement, ADR-0025), and the watcher reconciles any
write it does observe.

The clipper receiver lives in Rust (the authenticated loopback listener,
ADR-0173). Rust could write the file itself, or it could hand the validated
payload to the main webview and let the webview use the canonical path.

Two hard requirements:
- Never write to the vault directly from the extension.
- Keep **one** write path, not two, so ADR-0058's guarantees cannot drift.

## Options

### Option 1 — Rust writes the file directly

- Pros: works even if the main webview is closed/reloading; no IPC hop.
- Cons: creates a **second writer** that must re-implement atomicity and then
  relies on the watcher for indexing; it is *not* the canonical path, so H1
  handling, workspace state, and tag index would all be updated only indirectly.

### Option 2 — Rust validates, main webview writes via the canonical path

- Pros: reuses `createNoteInVault` / `appendToNoteInVault`, so tree, indexer,
  backlinks, tags, and sync behave exactly as for an in-app note; single writer;
  Rust stays I/O + validation only (ADR-0025).
- Cons: depends on the main webview being alive. Because the main webview exists
  for the app's lifetime (even when hidden to tray), this is normally true; on
  cold start it needs a short buffer until the webview signals ready.

## Decision (recommended)

**Option 2.**

- The receiver authenticates and validates the payload (ADR-0173), then emits a
  `clipper:clip-received` event carrying the validated `ClipPayload`. Rust does
  not write note content.
- `apps/desktop/src/clipper/clipperService.ts` consumes the event and calls the
  canonical helpers:
  - create → existing `createNoteInVault(path, content)`;
  - append/prepend → a new `appendToNoteInVault`/`prependToNoteInVault` that
    reads the note, merges frontmatter, and calls `writeNote` under
    `withVaultWatchSuppressed`, mirroring `createNoteInVault`'s indexing.
- If the main webview is not ready yet (cold start), Rust holds the validated
  payload in a small in-memory buffer and (optionally) the persisted queue file
  (ADR-0178), and flushes it once the webview signals ready.
- Path/name safety is enforced **twice**: `clipper-core` normalizes, and Rust's
  `resolve_in_vault` rejects traversal/absolute/escape as it does for every other
  write.

**DB concurrency requirement (verbatim, applies here):**

> Any step that touches vault-index.db must follow the standing withDbLock/WAL concurrency rules.

## Consequences

- One writepath. A clipped note is indistinguishable from an in-app-created note
  to the rest of the system.
- Append/prepend is a genuinely new helper and needs its own conflict handling
  (the app already has save-time external-change classification, ADR-0170) — it
  must not blind-write over a file that changed on disk.
- The cold-start buffer is a new, small stateful piece; it is bounded and drained
  by an event, not a timer (PERFORMANCE.md rule 9).

## Performance cost

- One extra IPC hop (Rust → webview → Rust `write_note`) per clip; user-initiated,
  once per clip, negligible.
- No per-keystroke or background work; zero cost when idle.

## Open decisions

- Confirm Option 2 over a Rust-side write.
- Confirm append/prepend semantics: does append insert after frontmatter and
  before/after the first heading? (Obsidian docs: append "at the top or bottom" of
  an existing note.) Proposed: bottom = end of file; top = after frontmatter.
