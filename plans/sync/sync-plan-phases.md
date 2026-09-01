# Sync Feature — Build Plan (Drive / Syncthing, No Backend)

Supersedes the original sync-server-backed design implied by
mobile-stack-architecture.md's early planning. This plan builds two
independent, backend-free sync modes: Google Drive (app-owned sync logic
against Drive's API) and Syncthing/folder-sync (app reacts to external
file changes, owns no sync logic). Manifest-diff, not CRDT — consistent
with the existing sync architecture decision, just relocated off a
self-hosted server.

Read `AGENTS.md`, `DECISIONS.md` (the ADR index) before every session —
open a specific ADR only if the index points to one directly relevant, do
not read the full `docs/adr/` directory. Also read `PROGRESS.md` and
`PERFORMANCE.md`. Log new decisions as new ADRs, indexed in `DECISIONS.md`.
The ADR covering the original sync-server approach must be marked
Superseded once Phase 0 below is complete — do not leave it as an
uncorrected, misleading Accepted entry.

---

## Phase 0 — Formal Supersession & Scope Lock

**Goal**: correct the decision record before any code, and lock the scope
boundary between what this plan builds and what it explicitly doesn't.

- Write a new ADR: "Sync via Drive/Syncthing, no owned backend" —
  supersedes the earlier sync-server-based approach. State the reasoning
  from this plan's §1/§2/§6 (no backend to own/run/pay for, two modes
  instead of a forced abstraction).
- Mark the prior sync-server ADR's status as "Superseded by [new ADR]" in
  `DECISIONS.md` — content stays untouched, only status changes, per your
  ADR-immutability convention.
- Remove or explicitly deprecate `services/sync-server` from the monorepo
  scaffold's active packages if it was ever started — confirm nothing
  downstream (mobile plans, CI pipeline) still assumes it exists.

**Checkpoint**: the decision record is accurate before any implementation
begins — a future session reading `DECISIONS.md` sees the current
architecture, not a stale one.

---

## Phase 1 — Manifest Infrastructure (Shared by Both Modes)

**Goal**: the local manifest — hash, size, Lamport clock, tombstone per
file — built once, usable by both Drive and Syncthing modes, testable
with zero network/external-tool dependency.

- Define `ManifestEntry` per the plan's §3.1 shape, in a shared package
  (not duplicated between modes)
- Implement manifest generation: walk the vault, hash file contents
  (BLAKE3 — confirm availability on both the Rust side and JS side if
  needed, or do this hashing exclusively in Rust and expose it via IPC,
  consistent with your "Rust for I/O, JS for logic" boundary — state
  which was chosen)
- Fast-path optimization: skip re-hashing a file if size+mtime match the
  last known-good manifest entry — this matters directly for
  `PERFORMANCE.md`'s batching discipline, same principle as the vault
  indexing batching fix from earlier in this project
- Unit tests: manifest generation on a fixture vault, fast-path skip logic
  correctness, tombstone handling for deleted files

**Checkpoint**: manifest generation is correct, tested, and fast (skips
re-hashing unchanged files) — no Drive or Syncthing code exists yet.

---

## Phase 2 — Drive Mode: Auth

**Goal**: OAuth against Google Drive, tokens stored securely, before any
sync logic touches the API.

- Desktop app OAuth client + PKCE, loopback redirect for login — no
  client secret embedded anywhere in the shipped app
- Token storage via Tauri's stronghold/keyring plugin (OS keychain), not
  plaintext, not application-level storage
- **Before writing any of this**: research and log an ADR on the actual
  current Google OAuth verification requirements for the `drive.file`
  scope — this plan's own §8 flags this as unresolved, and it's the
  single biggest external-dependency risk in the whole plan. Confirm
  whether verification is required at your expected user count, and how
  long that process realistically takes, before committing further
  engineering time downstream of this phase.
- Token refresh flow, handling expiry gracefully without requiring the
  user to re-auth constantly

**Checkpoint**: a user can sign in with Google, token is stored securely,
refreshes correctly — and you have a real, researched answer on
verification requirements before proceeding to Phase 3.

---

## Phase 3 — Drive Mode: Manifest Sync & Blob Transfer

**Goal**: the actual sync pass — diff manifests, transfer changed files.

- Store/fetch per-device manifest JSON in the app-scoped Drive folder
  structure from §3.1
- Use Drive's Changes API (`changes.list` + stored `startPageToken`) —
  not repeated full-folder listing, per §3.4's efficiency requirement
- Three-way diff (local vs. last-synced vs. remote) → push/pull/conflict
  per path, per §3.1 step 3
- Content-hash-keyed transfer to skip re-uploading identical content
- Apply pulled changes to disk, update local manifest and FTS5 index
  incrementally — reuse the existing incremental index-update mechanism,
  don't build a second one for sync-originated changes
- Batch requests where Drive's API allows it

**Checkpoint**: two devices signed into the same Drive account correctly
sync new/changed/deleted files to each other, without polling per-file,
without duplicate uploads of unchanged content.

---

## Phase 4 — Drive Mode: Conflict Resolution

**Goal**: the hardest correctness problem in this plan — handle
simultaneous edits without silently losing content.

- Text files (`.md`, canvas `.json`): three-way merge using the
  last-synced version as common ancestor. Unresolvable hunks → inline
  conflict markers written into the file + a UI flag.
- **Critical, not optional**: test merge output against your actual
  wikilink syntax and canvas JSON structure specifically — confirm a
  conflict marker inserted mid-document cannot corrupt a `[[wikilink]]`
  or produce invalid canvas JSON. This is the part of the whole plan most
  likely to have a subtle, damaging bug if under-tested; treat it with
  the same rigor as the canvas nested-cycle verification from earlier in
  this project — construct specific adversarial test cases, don't just
  test the happy path.
- Binary files: no merge attempt, conflict produces a copy
  (`image (device-name copy).png`)
- Delete-vs-edit: edited version wins, delete becomes a no-op, flagged
  for review — confirm this is surfaced somewhere the user will actually
  see it, not just logged silently

**Checkpoint**: simultaneous edits on two devices produce correct
merges where possible, clearly-marked conflicts where not, and never
silent data loss — verified against real wikilink and canvas content, not
just plain text fixtures.

---

## Phase 5 — Syncthing Mode

**Goal**: the "bring your own tool" path — the app reacts well to
externally-changed files, owns zero sync logic.

- This phase should mostly validate/extend the file-watcher already
  built for desktop (reindex on external change, refresh open note if
  changed on disk) — confirm it's robust enough for this use case rather
  than building a new watcher
- Recognize Syncthing's `.sync-conflict-<timestamp>.md` filename pattern,
  surface these in a "conflicts" view rather than leaving them as stray
  files the user has to discover manually
- Setup UX: point the user at picking their Syncthing-synced folder as
  the vault root — no IPC with the Syncthing daemon in this phase, per
  the plan's stated v1 scope

**Checkpoint**: files changed externally (simulating what Syncthing would
do) are picked up correctly; conflict files are surfaced clearly in the
UI, not left as unexplained stray files.

---

## Phase 6 — Mode Selection & Settings UI

**Goal**: user picks one mode per vault at setup, framed as intentionally
different experiences per §5, not equal peers.

- Vault setup/settings UI presenting both modes with the framing from
  §5 — Drive as the polished, recommended, built-in path; Syncthing/
  folder-sync as the bring-your-own-tool option
- No mid-use mode switching in v1 (manual export/reimport is the
  documented escape hatch) — confirm the UI doesn't imply switching is
  supported if it isn't
- Follow `AGENTS.md`'s component rules: colocated styles, Storybook
  story, test in the same PR

**Checkpoint**: a user can choose and configure either mode from a real
settings UI; the UI doesn't overstate what v1 actually supports.

---

## Phase 7 — Regression & Performance Pass

**Goal**: confirm sync composes correctly with everything else, and
doesn't violate `PERFORMANCE.md`.

- Large vault sync (reuse the existing large fixture vault) — confirm
  manifest generation, diffing, and transfer stay fast, confirm the
  fast-path skip from Phase 1 is actually working under real conditions
- Confirm sync doesn't block editor responsiveness (async, per
  `PERFORMANCE.md`'s standing rule) — sync running in the background
  while actively typing must not introduce lag
- Confirm canvas files and image attachments sync correctly alongside
  notes, not just markdown
- Update `PROGRESS.md` with a closing summary; log a final ADR indexing
  all decisions made across Phases 0-7

**Checkpoint**: full regression sweep passes; large-vault sync performance
is acceptable; sync doesn't degrade the app's core responsiveness.

---

## What's Deliberately Out of Scope (per the plan's §1 non-goals)

- Real-time collaborative editing
- A managed/paid sync tier
- Automatic mode-switching or migration between Drive and Syncthing
- Git-based sync (rejected per §7 — separate from any future local-history-via-git feature, which is unrelated)
- Syncthing daemon IPC (status/pairing UI inside the app) — deferred, v1 is folder-pointing only

---

## Sequencing Notes

- **Phase 2's OAuth verification research is the single highest-risk item
  in this entire plan** — it's an external dependency on Google's review
  process, not something engineering effort alone can resolve. Do this
  research before investing heavily in Phase 3/4, since a verification
  requirement with a long turnaround could reshape your rollout timeline
  independent of how well the code is built.
- **Phase 4 (conflict resolution) deserves more real time than its single
  phase entry suggests** — this is the correctness-critical core of Mode
  A. Don't compress it to keep pace with the rest of the plan; a
  data-loss bug here is far worse than a delayed timeline.
- Phase 1 (manifest infrastructure) is shared foundation for both modes —
  get it right once rather than letting Drive-mode-specific assumptions
  leak into it, since Syncthing mode needs the same manifest concept even
  though it doesn't drive the actual sync.