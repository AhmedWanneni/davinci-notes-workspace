# Vim Keybindings — Build Plan

Target: opt-in Vim-style keybindings for the CodeMirror 6 editor, matching
the pattern Obsidian itself ships (a settings toggle, not a core/default
behavior). This is purely an editor-layer feature — it should not touch
the data model, indexer, sync, or canvas. Low architectural risk, real
value to a specific audience, same category as the earlier "Emacs
keybindings" discussion — this plan is the concrete version of that for
Vim specifically, since Vim has an actual mature CodeMirror 6 package
where Emacs does not.

Read `AGENTS.md`, `DECISIONS.md` (the ADR index) before every session —
open a specific ADR only if the index points to one directly relevant, do
not read the full `docs/adr/` directory. Also read `PROGRESS.md` and
`PERFORMANCE.md`. Log new decisions as new ADRs, indexed in `DECISIONS.md`.

---

## Phase 1 — Package Evaluation & Lazy-Load Boundary

**Goal**: confirm the right dependency, and that it costs nothing for
users who never enable it, before any wiring.

- Evaluate `@replit/codemirror-vim` — the standard, actively maintained
  Vim keybinding package for CodeMirror 6 (this is genuinely the closest
  thing to a canonical choice here, unlike the Emacs case where no
  comparable package exists) — confirm its current maintenance status and
  bundle size before committing
- Confirm this lives in `@app/editor` (per ADR-0027's shared editor
  package, consumed by both desktop and mobile), not duplicated per app
- **Lazy-load requirement, non-negotiable per `PERFORMANCE.md`**: Vim mode
  must not be in the initial editor bundle for users who never enable it
  — this is the same discipline already applied to PDF.js (canvas plan)
  and React Flow (canvas package). Design the loading boundary now: the
  vim extension should only be dynamically imported when the setting is
  actually turned on, not bundled with the base CodeMirror setup
- Log the package choice and lazy-load design as an ADR

**Checkpoint**: package chosen, bundle-size cost documented, lazy-load
boundary designed — confirmed via a bundle analysis showing the vim
package is absent from a build with the setting off, before any real
integration work begins.

---

## Phase 2 — Settings Toggle & Basic Wiring

**Goal**: a working on/off setting that actually loads/unloads the
keymap correctly.

- Add "Vim keybindings" as a toggle in the existing settings UI (reuse
  the settings panel/persistence mechanism already established — the
  SQLite `settings` table per ADR-0033 — don't invent new settings
  storage for this one preference)
- Wire the toggle to dynamically load the vim extension into CodeMirror's
  configuration when enabled, and correctly remove/disable it when turned
  off — confirm toggling off actually restores normal (non-modal) editing
  behavior immediately, not just visually but functionally
- Confirm this takes effect on the next keystroke/immediately for
  already-open notes, without requiring an app restart — same standard
  applied to other settings toggles in this app

**Checkpoint**: toggling the setting on/off correctly enables/disables
Vim keybindings in any open editor, immediately, without restart; the
lazy-load bundle check from Phase 1 still holds with the toggle wired in.

---

## Phase 3 — Core Modal Editing Verification

**Goal**: confirm the fundamentals actually work correctly inside your
specific editor setup, not just in isolation.

- Verify normal/insert/visual mode switching and basic motions (`hjkl`,
  word motions, line motions) work correctly
- Verify this doesn't conflict with any existing CodeMirror keybindings
  your editor already defines (wikilink autocomplete triggers, any custom
  shortcuts built during the editor phase of the desktop app plan) — Vim
  mode remaps many keys, including some letters that could collide with
  existing custom bindings; check this explicitly rather than assuming
  the vim package handles precedence correctly by default
- Verify text object commands and common editing operations (`dd`, `yy`,
  `p`, etc.) work correctly against real note content, including content
  with wikilinks and other custom decorations — confirm Vim's operations
  don't corrupt or misbehave around your live-preview decorations
  (raw-markdown-at-cursor rendering) from the original editor phase

**Checkpoint**: core Vim modal editing works correctly on real note
content without conflicting with existing editor features (wikilink
autocomplete, live-preview decorations).

---

## Phase 4 — Mode Indicator

**Goal**: the user can see which Vim mode they're in — a real UX
requirement, not optional polish, since modal editing without a visible
mode indicator is confusing and error-prone.

- Add a mode indicator (NORMAL / INSERT / VISUAL / etc.) to the status
  bar built during the UI overhaul, consistent with how Obsidian surfaces
  this — reuse the existing status bar region rather than adding a new
  UI surface just for this
- Confirm the indicator updates immediately and correctly on every mode
  change
- Confirm the indicator only appears when Vim mode is actually enabled —
  it must not clutter the status bar for users who never turn this
  setting on

**Checkpoint**: mode indicator accurately reflects current Vim mode in
real time, and is completely absent when the setting is off.

---

## Phase 5 — Ex Commands & App Integration

**Goal**: decide which Vim Ex commands (`:w`, `:wq`, `:qa`, etc.) make
sense given this app's actual save model and tab system, rather than
assuming Vim's file-based command set maps directly onto an app that
already autosaves.

- **This is a real design decision, not a default to inherit from the
  package**: your app already debounce-saves on every edit (per the
  editor phase's established pattern) — there is no manual "save" action
  in the traditional Vim sense. Decide explicitly: do `:w`/`:wq` become
  no-ops (since saving is already continuous), do they force an immediate
  flush of the pending debounced save (a reasonable, low-risk mapping),
  or are Ex commands scoped down entirely to only the ones that make
  sense in this context? State the decision and reasoning, don't silently
  wire `:q` to something destructive like closing without confirming, or
  leave commands present but confusingly non-functional
- Decide whether `:q`/`:wq`-style commands should close the current tab
  (mapping onto your existing tab-close behavior, including the
  flush-on-close discipline already established) — if implemented, this
  must respect the same flush-pending-save behavior as any other tab-close
  path, not bypass it
- **Multi-tab close commands are in scope** — implement `:qa` (close all
  open tabs) and `:wqa` (flush all pending saves, then close all tabs),
  mapped onto your existing tab system rather than any Vim-native buffer
  concept. This is straightforward once single-tab `:q`/`:wq` is correct:
  iterate the same close-with-flush logic across every open tab, not a
  separate implementation. Confirm this correctly flushes EVERY affected
  tab's pending debounced save before closing any of them — a partial
  flush (some tabs saved, one missed) here would be a real data-loss risk,
  worth explicit testing with several tabs simultaneously mid-edit.
  Decide whether an unsaved/in-progress state on any tab should prompt
  confirmation before a bulk close, or whether the flush-before-close
  guarantee makes that unnecessary (likely the latter, given saves are
  debounced not manual — state which was decided)
- Log this mapping decision as an ADR — it's genuinely non-obvious given
  how different this app's save model is from a traditional file editor

**Checkpoint**: Ex commands that were chosen to be supported behave
correctly and consistently with the app's actual save/tab-close model,
including correct behavior when closing multiple tabs at once (`:qa`/
`:wqa`) with no partial-flush data loss; commands deliberately not
supported fail gracefully (a clear message, not a silent no-op that looks
like it might have done something).

---

## Phase 6 — Regression Pass

**Goal**: confirm Vim mode composes correctly with everything else built
so far.

- Confirm wikilink click-to-navigate, autocomplete, and unresolved-link
  creation all still work correctly with Vim mode enabled
- Confirm this doesn't affect canvas text-card editing (per the canvas
  plan's Phase 2 decision to use a plain textarea, not the full editor,
  for canvas text cards) — Vim mode should have no effect there, confirm
  this boundary holds rather than assuming it based on the architecture
- Performance: confirm enabling Vim mode doesn't introduce editor
  responsiveness regressions, per `PERFORMANCE.md` — typing latency with
  Vim mode on should be indistinguishable from Vim mode off, on the same
  large-vault test conditions used elsewhere in this project
- Update `PROGRESS.md` with a closing summary; log a final ADR indexing
  all decisions across Phases 1-6

**Checkpoint**: full regression sweep passes; no performance regression;
Vim mode's boundary (editor only, not canvas cards) is confirmed correct.

---

## What's Deliberately Out of Scope

- **Custom `.vimrc`-style user configuration** (remapping keys, custom Vim
  macros) — a real Vim power-user feature, but meaningfully more complex
  than the base toggle; revisit only if real demand shows up, same
  reasoning applied to nested canvas and other low-priority-until-proven
  features elsewhere in this project
- **Vim mode on mobile** — touch-based modal editing is a poor fit
  generally (this mirrors the earlier decision to defer/scope down graph
  view on mobile); this plan is desktop-scoped, mobile is a separate
  future decision if ever revisited
- **Vim-style window splits** — CodeMirror's Vim package may support
  `:split`/`:vsplit`-style layout commands, but your app already has its
  own tab/pane model; don't let Vim's own multi-*pane-layout* concepts
  leak in and conflict with the app's existing tab system. This is
  distinct from multi-tab *close* commands (`:qa`/`:wqa`), which ARE in
  scope per Phase 5 — splits are a layout concept the app doesn't have an
  equivalent for, closing multiple tabs is just operating on tabs that
  already exist.

---

## Sequencing Notes

- Phase 1's lazy-load boundary is the one piece of foundational discipline
  worth getting right before anything else — same principle as every
  other optional/heavy feature in this project (PDF.js, React Flow):
  users who never touch this setting should pay zero cost for its
  existence.
- Phase 5 (Ex commands) is the one phase in this otherwise low-risk plan
  that actually requires real thought rather than following the package's
  defaults — your app's continuous-autosave model is different enough
  from what Vim commands traditionally assume that blindly wiring
  `:w`/`:q` to "whatever seems close enough" risks confusing or
  frustrating exactly the power-user audience this feature is meant to
  serve.
- This is a good candidate for a single, fairly short plan overall (6
  phases, mostly small) — don't over-scope it relative to how niche the
  audience is; the point is a solid, correct, well-bounded toggle, not an
  exhaustive Vim emulation layer.