# Stabilization Pass — Build Plan

Triggered by finding that "new note" — one of the most basic actions in
the app — had never worked correctly since it was originally built, and
slipped through every prior phase's verification. This is a deliberate
sweep of core CRUD operations and their surrounding integrations before
any new feature work resumes. Goal: find and fix what else is silently
broken, and understand why verification missed it the first time.

Same discipline as every other plan in this project: read `AGENTS.md`,
`DECISIONS.md` (index), `PROGRESS.md`, `PERFORMANCE.md` before every
session — not repeated per phase below. One phase, one concern, checkpoint
before moving on.

---

## Methodology (applies to every phase)

- **Test through the real UI, not code review.** A function that looks
  correct in source is not verified until it's actually clicked/triggered
  in the running app and its effect confirmed.
- **Check every entry point, not just the first one that works.** If a
  feature can be triggered three ways (icon rail, file tree, command
  palette), test all three independently — this is exactly how the
  new-note bug pattern hides: one path works, others silently don't.
- **Verify against the filesystem directly, not just the app's UI.** The
  UI can appear to succeed while the underlying file operation failed (or
  vice versa) — check the actual files on disk after every operation.
- **Test on the large fixture vault**, not a trivial 2-note test vault —
  bugs involving path collisions, indexing, or file tree state are more
  likely to surface with realistic data.
- **Report exactly what's found, including "this works correctly"** — a
  phase confirming something already works is still valuable information,
  not wasted effort.

---

## Phase 1 — Note CRUD

**Goal**: every way to create, rename, delete, move, and duplicate a note
actually works, from every entry point.

- Create: icon rail, file tree toolbar, command palette (if it exists),
  unresolved-wikilink-click — test each independently
- Rename: via file tree (inline rename or context menu), via command
  palette if available
- Delete: via file tree context menu, confirm with an "are you sure"
  safeguard exists (deleting a note is destructive, this should not be a
  single accidental click)
- Move: drag-and-drop in the file tree to a different folder, or a
  "move to" action if that's how it's implemented
- Duplicate: if this exists as a feature, test it; if not, note it as a
  gap, not a bug

**For each operation, verify**: the file on disk changes correctly, the
file tree reflects the change, the SQLite index updates correctly
(path changes must propagate to the `notes` and `links` tables — a rename
in particular is a known high-risk operation, per the original data-model
planning that flagged rename propagation as the most failure-prone
wikilink feature), any open editor tab for the affected note behaves
sensibly (doesn't silently point at a stale path).

**Checkpoint**: every note CRUD operation works from every entry point,
verified against the filesystem and the index, not just the UI.

---

## Phase 2 — Folder CRUD

**Goal**: same sweep, for folders.

- Create a folder (from file tree)
- Rename a folder — this must correctly update the path prefix for every
  note inside it, recursively, in both the filesystem and the SQLite index
- Delete a folder — confirm behavior with a non-empty folder (should
  likely require confirmation and cascade-delete contents, or refuse if
  non-empty — decide and confirm which behavior is actually implemented,
  don't assume)
- Move a folder (drag-and-drop to nest under a different parent)

**Checkpoint**: folder operations correctly cascade to every note inside
them, verified on a folder with multiple nested notes and subfolders, not
just a single-note folder.

---

## Phase 3 — Wikilink & Backlink Creation Paths

**Goal**: confirm the link-driven note-creation and link-integrity paths
that depend on Phase 1's core creation logic actually work end to end.

- Click an unresolved `[[wikilink]]` in a note, confirm it creates a new
  note with the correct name and opens it
- After Phase 1/2 rename operations: confirm existing `[[links]]`
  pointing at the renamed note/folder are updated (rename propagation) —
  this was flagged from the start as the highest-risk wikilink feature;
  test it directly rather than assuming it works
  - If rename propagation was never actually implemented (a real
    possibility given the new-note bug's discovery), this is the single
    most important gap to surface in this entire stabilization pass — a
    silent broken-link accumulation problem is worse than a UI action not
    working, because it corrupts data quietly over time
- Confirm backlinks panel correctly reflects new links created via this
  path, and correctly stops showing a link after the target is deleted

**Checkpoint**: this phase's outcome should be treated as high-priority
information regardless of result — confirm explicitly whether rename
propagation works, is partially working, or doesn't exist at all.

---

## Phase 4 — File Tree & Index Consistency Under Concurrent Change

**Goal**: confirm the watcher-driven update path (external changes) stays
correct alongside the UI-driven operations from Phases 1-3.

- Perform a Phase 1/2 operation (e.g. rename a note) via the app's UI,
  then immediately perform an external change (e.g. edit the same file
  directly in a text editor outside the app) — confirm no race condition,
  no duplicate/orphaned index entries, no file tree desync
- Create a note externally (outside the app) while the app is open,
  confirm the file tree and index pick it up correctly via the existing
  watcher path

**Checkpoint**: no desync between filesystem, SQLite index, and file tree
UI under back-to-back internal and external changes.

---

## Phase 5 — Open Editor State Across CRUD Operations

**Goal**: confirm the editor and tab system behave sensibly when the
currently-open note is affected by a CRUD operation.

- Rename a note while it's open in an editor tab — confirm the tab
  updates its title/path reference, doesn't silently break or point at a
  now-nonexistent path
- Delete a note while it's open in an editor tab — confirm the tab closes
  gracefully (or shows a clear "this note was deleted" state), doesn't
  crash or silently allow continued "editing" of a nonexistent file
- Move a note (to a different folder) while open — confirm the tab
  continues to reference it correctly at its new path

**Checkpoint**: no crashes, no silent data loss, no stale-path confusion
across all three scenarios above.

---

## Phase 6 — Root Cause: Why Did Prior Verification Miss This?

**Goal**: this is the most important phase in the whole pass — understand
the actual gap in process, not just the bugs found.

- Go back through `desktop-app-build-plan.md`'s phase-by-phase
  verification steps (particularly Phase 5 vault loading, Phase 6 editor,
  Phase 7 file tree) — each of these had a "create/verify a note" step.
  Determine specifically why none of them caught the new-note bug: was
  the verification step itself too narrow (e.g. tested creation via only
  one entry point, missing the one that was actually broken)? Was it
  skipped under time pressure? Was the bug introduced by a LATER phase
  that regressed something an earlier phase's verification had correctly
  confirmed at the time?
- This determines whether the fix is "patch the bug" alone, or "patch the
  bug AND tighten how future phases verify similar functionality" —
  don't skip this analysis even though it's less concrete than the bug
  fixes themselves

**Checkpoint**: a clear, specific answer for why this was missed — not a
generic "testing wasn't thorough enough."

---

## Phase 7 — Fix, Consolidate, and Add Regression Tests

**Goal**: fix everything found, and make sure it can't silently break
again.

- Fix every confirmed bug from Phases 1-5, prioritized by severity (data
  corruption/loss risks like broken rename propagation first, UI
  annoyances last)
- If duplicate/inconsistent implementations of the same operation were
  found (e.g. two different code paths for "create a note" that behave
  differently), consolidate to one canonical implementation used by every
  entry point — this is the actual fix for the root-cause pattern, not
  just patching each broken entry point independently
- Add unit/integration tests for every operation verified in this pass —
  particularly rename propagation and cascade-delete behavior, since
  these are exactly the kind of logic that regresses silently without a
  test guarding it going forward

**Checkpoint**: every bug from this pass has both a fix and a
regression test.

---

## Wrap Up

- Update `PROGRESS.md` with a full report: what was tested, what was
  found broken, what was already working correctly, what was fixed, and
  Phase 6's root-cause analysis
- Write new ADRs for any consolidation decisions (e.g. "note creation now
  has one canonical implementation used by all four entry points") —
  these are real architectural corrections worth documenting
- Explicitly decide and record: is the app now trustworthy enough to
  resume either feature work or real dogfooding? If Phase 3's rename-
  propagation check found a real gap, that's likely worth fixing before
  extensive dogfooding, since broken links accumulating silently would
  undermine the whole point of using the app for real notes

---

## How to Run This

- Recommend HIGH effort for Phase 3 (wikilink/rename propagation — this
  is the highest-risk area) and Phase 6 (root-cause analysis, genuine
  judgment required). MEDIUM is fine for the more mechanical CRUD-testing
  phases (1, 2, 4, 5).
- This is a good candidate for the same-session-plans-and-executes
  approach rather than a plan/execute split across two models — the value
  here is in a thorough, skeptical sweep, and a model executing someone
  else's test plan is less likely to notice something unexpected along
  the way than one that's actively investigating.
- Don't skip Phase 6 to save time — fixing bugs without understanding why
  verification missed them means the next feature phase is exposed to
  the same blind spot.