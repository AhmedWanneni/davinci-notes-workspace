# ADR-0177: Clipped notes are written through the canonical vault write path

## Status

Accepted.
Option 2 implemented: clipped notes are written through the canonical vault write path in `applyClipToVault.ts` using `createNoteInVault` and `appendToNoteInVault`, preserving indexing, disk tracking, atomicity, and `withDbLock`/WAL concurrency discipline.

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
  - append/prepend → a new `appendToNoteInVault(path, body, position)` that reads
    the note (its in-memory buffer if it is open), inserts the clip body at the
    top or bottom, and writes through `writeAndIndexNote` — one helper with a
    position, rather than separate append and prepend helpers.
- If the main webview is not ready yet (cold start), Rust holds the validated
  payload in a small in-memory buffer and (optionally) the persisted queue file
  (ADR-0178), and flushes it once the webview signals ready.
- Path/name safety is enforced **twice**: `clipper-core` normalizes, and Rust's
  `resolve_in_vault` rejects traversal/absolute/escape as it does for every other
  write.

**DB concurrency requirement (verbatim, applies here):**

> Any step that touches vault-index.db must follow the standing withDbLock/WAL concurrency rules.

## Implementation outcome (Phase 3 part 2, code landed)

Option 2 is built, on top of the dispatch half from Phase 3 part 1. The three
commits of this part: `f6d0244` (shared file shape), `ece9206`
(`appendToNoteInVault`), `6db0189` (the webview service and pairing UI).

**Where the file shape lives.** `composeNoteFile` and `suggestedFilePath` moved
from `apps/web-clipper` into `packages/clipper-core`, so the extension (which
composes the file it downloads) and the desktop (which composes the file it
writes) share one definition. A change to the shape can no longer land on one
side only, which is what "the downloaded file and the vault note are identical"
actually requires.

**Files.** `apps/desktop/src/clipper/{applyClipToVault,handleClipReceived,useClipperService,index}.ts`,
`apps/desktop/src/vault/appendToNoteInVault.ts` (exported through the vault
barrel), `apps/desktop/src/components/SettingsDialog/ClipperSettingsSection.tsx`.
The plan named a single `clipperService.ts`; the work split into three
single-responsibility files because the project caps files at 250 lines (the Rust
half split for the same reason, ADR-0180).

**`appendToNoteInVault` reuses `writeAndIndexNote`** rather than re-implementing
the write, so a clip gets the atomic write, `diskStateTracker` bookkeeping,
dirty-state clearing, `withDbLock`/`withDbTransaction` indexing (ADR-0168) and the
version-history record an autosave gets. It runs inside `queuePerPath`, so a clip
cannot interleave with an in-flight autosave for the same note: still exactly one
write path.

**Decisions taken while building (owner confirmation still open):**

- `create` never overwrites. A taken name gets ADR-0110's numeric suffix
  (`Note.md`, `Note 1.md`, `Note 2.md`) — plan §5 check 7. Dedupe (ADR-0178) is
  Phase 7, so a re-clip of the same page is deliberately a second file today.
- `append-top` is an **alias of `prepend`**: the wire carries both and both mean
  "insert above the existing body". `daily-append`/`daily-prepend` map to
  bottom/top and differ only in the note name their template renders.
- Append and prepend carry the **body only**, never a frontmatter block: a second
  `---…---` block in the middle of a note is literal text, not properties, and the
  note already has its own block. (Open: an appended source footer is not in the
  wire contract today.)
- A `top` insert lands **after** a leading frontmatter block, so it can never
  split a note's properties. When frontmatter is present there is exactly one
  blank line between the block and the content.
- A missing target is **created**, not rejected — plan §5 check 5. There is
  nothing to truncate, and a clip that survived the extension must survive the
  desktop.
- The note's own line ending is preserved and the seam is normalised to exactly
  one blank line. Only runs of line breaks at the seam are touched, so an append
  can never truncate the existing content.
- An **open** note's in-memory buffer wins over the on-disk copy, so a clip
  cannot silently revert unsaved typing.
- Failure mapping: an unexpected write failure becomes `app-busy`, the only
  *retryable* code on the wire, so the extension keeps the clip queued (ADR-0178)
  and a reported failure can never lose a clip. No vault open is `vault-not-open`,
  which means the webview (TS) is what produces that code today, not Rust.
  `target.vaultId` is **ignored**: the desktop has exactly one open vault and no
  way to identify it, so honouring a vault id is O4's problem.
- The Settings section takes every state change from the `ClipperStatus` a command
  returns rather than optimistically flipping its own toggle, so a failed bind
  (the port is already taken) surfaces as an alert.

**Cold start: no buffer.** The buffer recommended above (plus a webview-ready
signal) was **not** built. A clip arriving before the main webview is listening
waits out the 20 s handshake and is reported as `app-busy`; ADR-0178's extension
queue is the buffer. One mechanism instead of two, and it loses nothing. Revisit
only if that queue proves insufficient in practice.

## Consequences

- One writepath. A clipped note is indistinguishable from an in-app-created note
  to the rest of the system.
- Append/prepend is a genuinely new helper and needs its own conflict handling
  (the app already has save-time external-change classification, ADR-0170) — it
  must not blind-write over a file that changed on disk. As built it reads the
  latest content and merges onto it, but the residual window is the same as any
  autosave: an external edit landing between the read and the atomic write is not
  classified by ADR-0170.
- The cold-start buffer is a new, small stateful piece; it is bounded and drained
  by an event, not a timer (PERFORMANCE.md rule 9).

## Performance cost

- One extra IPC hop (Rust → webview → Rust `write_note`) per clip; user-initiated,
  once per clip, negligible.
- No per-keystroke or background work; zero cost when idle.

**As built (Phase 3 part 2).** No new third-party dependency: the desktop imports
`@app/clipper-core`, a workspace package that already existed. The whole clipper
surface the desktop adds is 20,789 B of TypeScript source across seven files
(7,116 B gzip *unminified, comments included*), so the minified bundle delta is
smaller than that and no size budget changes. The idle cost is one `listen()`
subscription for the app's lifetime, and nothing is bound to emit while the
clipper is disabled (ADR-0173).

## Open decisions

- Confirm Option 2 over a Rust-side write. (Implemented; the code is the
  recommendation. Owner sign-off still outstanding, as for every clipper ADR.)
- **Append/prepend semantics are now defined** (see "Implementation outcome"):
  bottom = end of file; top = after a leading frontmatter block. Confirm, in
  particular the two guesses: `append-top` being an alias of `prepend`, and an
  append carrying the body with no frontmatter and no source footer.
- Confirm the failure mapping: an unexpected write failure is reported as
  `app-busy` rather than a new code, relying on ADR-0178's queue for the retry.
- Confirm that the cold-start case needs no buffer, i.e. that a clip which arrives
  before the webview is listening may be answered `app-busy` and left to the
  extension's queue.
