# Attachments Feature — Build Plan

Target: implement Obsidian-style attachment management (per the "Manage
attachments" doc): importing files into the vault via paste, drag-and-drop,
or external download; the four default-attachment-location modes (vault
root, specified folder, same folder as current file, subfolder under
current folder); and folder auto-creation when a target subfolder doesn't
exist yet.

**Two things this doc references but does not itself define are explicitly
out of scope here**, same discipline as the HTML plan deferring `<iframe>`:
- **Accepted file formats** — the doc links to a separate "Accepted file
  formats" reference. This plan needs that list to know what counts as a
  valid attachment; if it isn't available, Phase 1 must produce a
  reasonable, explicitly-logged allowlist (common image/audio/video/PDF
  types) rather than silently guessing or accepting anything.
- **Embed files (rendering)** — the doc says attachments "can be embedded,"
  linking to a separate "Embed files" feature. This plan's job is getting a
  file *into* the vault and inserting the correct embed syntax
  (`![[filename]]`) at the cursor — actually rendering that embed (image
  preview, audio player, PDF viewer, etc.) is that separate feature's job,
  not this one's.

This spans more than one package: file-format allowlist and settings
schema are shared/core concerns; actual filesystem writes go through
Tauri's fs plugin (desktop) and its mobile equivalent; paste/drop
detection and embed-syntax insertion belong in `@app/editor`.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `PERFORMANCE.md` before
every session. Consult `DECISIONS.md` (the ADR index) only — do not read
the full `docs/adr/` directory; open a specific ADR only if the index
points to one directly relevant. Log new decisions as new ADRs, indexed in
`DECISIONS.md`.

---

## Phase 1 — Accepted Formats & Attachment Settings Data Model

**Goal**: define what counts as a valid attachment and how the default
location is configured, with no file I/O or UI yet.

- Define the accepted-file-formats allowlist. If the referenced "Accepted
  file formats" doc's content isn't available, decide a reasonable starting
  set (common image types, audio types, video types, PDF) and log it
  explicitly as an ADR flagged for revision once the real reference doc is
  available — don't guess silently and don't accept arbitrary file types
  by default
- Define the settings schema for "Default location for new attachments"
  with exactly the four documented modes:
  - Vault folder (root)
  - In the folder specified below (a fixed, user-chosen path)
  - Same folder as current file
  - In subfolder under current folder (a named subfolder, relative to
    whatever note is being edited)
  - Persist this via the app's existing settings/state mechanism (Zustand
    store, per `AGENTS.md`'s folder structure) — don't invent a new
    settings persistence path if one already exists for other preferences
- Write a **pure, unit-testable resolution function**: given the current
  note's path, the settings mode, and (if applicable) the specified
  folder/subfolder name, compute the target folder an incoming attachment
  should be written to. No file I/O in this function — it just computes a
  path
- Unit tests: all four modes, including edge cases (note not yet saved/no
  current file path, specified folder path that doesn't exist yet, nested
  subfolder scenarios)

**Checkpoint**: accepted-formats allowlist and settings schema are defined
and logged; the location-resolution function is unit-tested for all four
modes; no filesystem writes or UI exist yet.

---

## Phase 2 — Filesystem Write & Filename Handling

**Goal**: given raw file data and a resolved target folder (from Phase 1),
actually write the file into the vault correctly. No paste/drop trigger
yet — this is the core "save it" mechanism, testable in isolation.

- Implement the write path using Tauri's fs plugin (desktop) and its
  mobile equivalent — check `AGENTS.md`'s performance principle: prefer
  native fs APIs over any JS polyfill, and ensure writes are async/non-
  blocking, especially for larger files (audio/video/PDF)
- Folder auto-creation: if the resolved target folder (e.g. an "in
  subfolder under current folder" mode with a not-yet-existing subfolder)
  doesn't exist, create it as part of the write — per the doc's explicit
  behavior ("Obsidian creates it when you add an attachment")
- Filename collision handling: decide and implement the exact behavior
  when a file with the same name already exists at the target location
  (e.g. append a numeric suffix) — log this as an ADR, it's a real user-
  facing behavior decision, not an implementation detail
- Format validation: reject (with a clear message) any incoming file whose
  type isn't in Phase 1's accepted-formats allowlist, rather than silently
  writing it or silently failing
- Unit/integration tests: successful write to each of the four resolved
  location types, folder auto-creation, filename collision resolution,
  and rejection of a disallowed format

**Checkpoint**: given file data and a target folder, the file is written
correctly, folders are auto-created when needed, name collisions are
resolved per the logged decision, and disallowed formats are rejected —
all verified without any editor/UI integration yet.

---

## Phase 3 — Paste Attachment Handling (Editor)

**Goal**: pasting a file (not text) into the editor writes it via Phase 2
and inserts the embed syntax at the cursor.

- Detect when a paste event's clipboard content is a file (image, audio,
  etc.) rather than plain text — hook into the editor's existing paste
  handling if one already exists (check before adding a new paste listener
  path)
- Route the pasted file's data through Phase 2's write logic, using Phase
  1's location-resolution function (current note path + settings) to
  determine where it lands
- Insert `![[filename]]` (or whatever the app's actual embed-link syntax
  convention is — confirm against existing wikilink syntax handling if
  that's already implemented) at the cursor position once the write
  succeeds
- Do not attempt to render the embed's content here — inserting correct
  syntax is this plan's job; actual rendering is the separate "Embed
  files" feature
- Handle write failure gracefully (disallowed format, filesystem error) —
  show a clear message, don't silently insert a broken/dangling embed
  reference
- Performance: writing a large pasted file must not block the editor's
  responsiveness — confirm this is genuinely async per `PERFORMANCE.md`

**Checkpoint**: pasting an accepted file type into the editor writes it to
the correct location per current settings and inserts working embed
syntax at the cursor; pasting a disallowed format shows a clear rejection
message; large-file paste doesn't block the UI.

---

## Phase 4 — Drag & Drop Attachment Handling (Editor)

**Goal**: dragging a file from the OS file system and dropping it into the
editor behaves identically to Phase 3's paste flow.

- Detect file drop events on the editor surface
- Reuse Phase 2's write logic and Phase 3's embed-syntax insertion — this
  phase should be almost entirely wiring, not new write/insert logic
- Support multiple files dropped at once (insert one embed reference per
  file, in a sensible order)
- Add a visual drop-zone indicator per `AGENTS.md`'s design principles
  (border-based, no shadows/gradients) — check the design-system tokens
  for whatever equivalent state (e.g. active/hover) convention already
  exists before inventing new styling
- Same graceful-failure behavior as Phase 3 for disallowed formats or
  write errors

**Checkpoint**: dropping one or more accepted files onto the editor writes
each correctly and inserts embed syntax for each, reusing Phase 2/3's
logic; a visual drop-zone indicator appears during drag-over; disallowed
formats fail gracefully.

---

## Phase 5 — Settings UI

**Goal**: a real settings panel lets the user configure the default
attachment location, per Phase 1's schema.

- Build the "Files & Links → Default location for new attachments" UI:
  the four-mode selector, plus a folder picker/text input for "in the
  folder specified below" and a subfolder name input for "in subfolder
  under current folder"
- Wire directly to Phase 1's settings schema/store — no parallel state
- Follow `AGENTS.md`'s component rules: colocated `.module.scss`,
  Storybook story (all four mode states), and a test in the same PR
- Confirm changing the setting takes effect immediately for the next
  paste/drop, without requiring an app restart

**Checkpoint**: settings UI renders all four modes correctly, persists the
choice, and the choice is reflected in the very next attachment add
(paste or drop) without restart.

---

## Phase 6 — Externally Downloaded Attachments (Verification)

**Goal**: confirm files saved directly into the vault folder from outside
the app (e.g. a browser download configured to save there) are correctly
recognized, per the doc's third documented way to add an attachment.

- This is largely a **verification phase, not new write-path code** — the
  vault is a real folder on disk, so an externally-added file already
  exists there; the open question is whether the app's existing file-
  watching/indexing mechanism (used for sync or wikilink resolution)
  picks it up correctly
- Confirm a file dropped into the vault folder via the OS (outside the
  app) appears and is embeddable (`![[filename]]` resolves and eventually
  renders once the separate Embed files feature exists) without requiring
  an app restart
- If the existing indexer/file-watcher does NOT pick up externally-added
  files reliably, that's a gap in that underlying mechanism, not something
  to patch here — flag it as an issue against that system rather than
  building a parallel watcher

**Checkpoint**: a file manually placed into the vault folder (or a
configured attachment subfolder) is recognized by the app and can be
referenced by an embed link, without an app restart — or, if this
currently doesn't work, the gap is clearly identified and attributed to
the correct underlying system.

---

## Phase 7 — Regression & Integration Pass

**Goal**: confirm attachments compose correctly with everything else
already built.

- Confirm pasting/dropping an attachment inside a list, blockquote, or
  table still inserts the embed link correctly at the right position
- Confirm the vault-wide indexer picks up new attachment files for
  wikilink/backlink resolution consistent with how it already handles
  note-to-note links (reuse existing incremental-update mechanism, don't
  duplicate)
- Confirm attachments and Tags/HTML features don't conflict — e.g. an
  embed-link syntax character sequence inside a sanitized HTML block
  (from the HTML plan) doesn't get misinterpreted, and vice versa
- Performance check per `PERFORMANCE.md`: pasting/dropping several large
  files in sequence (e.g. multiple images) doesn't degrade editor
  responsiveness — confirm writes are properly async/batched, not
  serialized in a way that blocks typing
- Update `PROGRESS.md` with a closing summary, append full detail to
  `docs/HISTORY.md`, and log a final ADR indexing all decisions across
  Phases 1–7 (accepted-formats allowlist, filename collision behavior,
  embed-syntax convention, and anything else logged along the way)

**Checkpoint**: full regression sweep passes; attachments compose
correctly with other block types and features; large/multiple-file
paste-drop performance is acceptable.

---

## What's Deliberately Out of Scope

- **Embed files (rendering)** — this plan inserts correct embed syntax and
  gets the file into the vault; actually displaying an image inline, an
  audio player, a PDF viewer, etc. is the separate "Embed files" feature,
  out of scope here.
- **The full "Accepted file formats" reference** — if unavailable at
  planning time, Phase 1 produces a reasonable starting allowlist flagged
  for revision, not a final, authoritative list.
- **Attachment management UI beyond settings** (e.g. a dedicated
  "orphaned attachments" cleanup view, bulk re-location of existing
  attachments when the setting changes) — not documented in the source
  doc, so not covered here; a candidate for its own future scoped plan.

---

## Sequencing Notes

- Phase 1 (formats + settings schema) and Phase 2 (filesystem write) are
  the foundation — get the location-resolution logic and write mechanism
  right and fully isolated/testable before any editor wiring, since Phase
  3 and Phase 4 should be almost pure wiring on top of them, not places
  where new write/collision logic gets invented a second time.
- Phase 3 (paste) and Phase 4 (drag-and-drop) are intentionally sequenced
  so drag-and-drop can reuse paste's write/insert logic directly — if
  Phase 4 finds itself duplicating meaningful logic from Phase 3 rather
  than just wiring a different trigger to the same functions, that's a
  sign Phase 3 wasn't factored generally enough.
- Phase 6 is the one phase in this plan most likely to reveal it's not
  actually new work — confirm the existing indexer/file-watcher already
  handles this before assuming a new mechanism is needed.