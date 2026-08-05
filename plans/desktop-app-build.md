# Desktop App — Step-by-Step Build Plan

Master sequence tying together everything decided so far. Each phase lists
what to do, which existing doc/prompt to use (if one exists), and what
"done" looks like before moving on. Follow this order — later phases
assume earlier ones are genuinely finished, not just started.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, and `PERFORMANCE.md` before
every session, for the entire project, no exceptions — this is stated once
here and not repeated in every phase below, but it applies throughout.

---

## Phase 0 — Repo Foundation

**Goal**: a working monorepo with process/tooling in place before any real code lands.

| Step | Use | Done when |
|---|---|---|
| 0.1 Scaffold monorepo | `monorepo-scaffold-prompt.md` | pnpm workspaces + Turborepo wired, package boundaries lint-enforced, empty packages/apps exist |
| 0.2 Git/CI/Husky setup | `git-ci-setup-prompt.md` | Hooks, CI pipeline, branch protection, PR template, Changesets all verified working (not just configured) |
| 0.3 .gitignore | `gitignore-setup-prompt.md` | Nothing that should be ignored shows up in `git status`; two flagged decisions (Tauri gen/ folders, token build output) resolved |

**Checkpoint before Phase 1**: open a throwaway PR, confirm the full CI pipeline runs and branch protection actually blocks a bad merge. Don't proceed on faith.

---

## Phase 1 — Design System Tokens & Foundation

**Goal**: the visual language exists and is confirmed before anything is built on top of it.

| Step | Use | Done when |
|---|---|---|
| 1.1 Tooling (PostCSS, Stylelint, Storybook, Vitest) | `design-system-build-prompt.md` Phase 1 setup + `design-system-plan.md` Phase 0 | Storybook builds and renders through the real SCSS/PostCSS pipeline |
| 1.2 Tokens via Style Dictionary | `design-system-build-prompt.md` Phase 1 | Color/type/space/border/motion tokens built, output as SCSS vars + CSS custom properties + TS constants |
| **1.3 Manual review** | — | **You personally review actual color/font values** before anything else is built — this is the one hard manual gate in the whole plan |
| 1.4 Reset + global mixins | `design-system-plan.md` Phase 2 | Stylelint rejects raw hex/px outside `tokens/` |

**Checkpoint before Phase 2**: token values are confirmed by you, not placeholder. Everything downstream assumes these are final.

---

## Phase 2 — Design System Primitives

**Goal**: a reviewable, tested component library — not just visually, but with stories/tests/a11y per the checklist already defined.

Build order (one fully "done" per session, per `design-system-build-prompt.md`'s checklist — component + stories + interaction test + a11y pass + TSDoc):

1. Typography
2. Button
3. Input
4. Checkbox / Radio / Toggle
5. Divider
6. Badge / Tag
7. Tooltip *(Radix)*
8. Dialog *(Radix)*
9. DropdownMenu *(Radix)*
10. Popover *(Radix)*

**Checkpoint before Phase 3**: at minimum Typography, Button, Input, and Divider are fully done — these are what the app shell needs first. The rest can continue in parallel with Phase 3+ if useful, but don't block app-shell work waiting for every primitive.

---

## Phase 3 — Tauri Desktop Shell

**Goal**: a real, running desktop app wired to the design system.

| Step | Use | Done when |
|---|---|---|
| 3.1 Tauri init + workspace integration | `tauri-desktop-setup-prompt.md` | `apps/desktop` builds via Turborepo, depends on `@app/design-system` via `workspace:*` |
| 3.2 Shell UI proof | same prompt, step 3 | A design-system component renders correctly inside the actual Tauri webview (not just Storybook) |
| 3.3 Baseline measurement | same prompt, step 5 | Startup time + bundle size recorded in `PROGRESS.md` as the tracked baseline (ties to `PERFORMANCE.md`'s startup budget rule) |

**Checkpoint before Phase 4**: `pnpm turbo run dev --filter=apps/desktop` launches a real window. This is your first genuinely running app — worth pausing here and actually looking at it before adding features.

---

## Phase 4 — Core Data Layer (shared packages, platform-agnostic)

**Goal**: the logic every feature depends on, built once, testable in isolation, with zero UI or Tauri coupling.

| Step | What | Package |
|---|---|---|
| 4.1 Core types | `Note`, `Link`, `Vault`, `Frontmatter` interfaces per `obsidian-clone-stack.md`'s data model | `packages/core-types` |
| 4.2 Wikilink parser | Handles `[[Note]]`, `\|alias`, `#heading`, `#^block-id`, unresolved links — per the wikilink discussion earlier in this project | `packages/indexer` |
| 4.3 Frontmatter parser | YAML frontmatter extraction | `packages/indexer` |
| 4.4 Graph builder | Notes + links → node/edge graph, backlink reverse-index | `packages/indexer` |
| 4.5 SQLite schema | `notes` and `links` tables per the schema already defined, with the `idx_links_target` index for cheap backlink queries | `packages/indexer` (schema) + Rust side (`db.rs`) |

**Every function here gets a unit test before moving on** — this is the highest-leverage place for tests in the whole app, since everything else reads from it. Follow `AGENTS.md` file-size/colocation rules strictly; this is exactly the kind of code that AI sessions can accidentally let sprawl into one big file if not watched.

**Checkpoint before Phase 5**: parser and graph-builder functions pass tests against realistic fixture vaults (a handful of interlinked `.md` files with edge cases — unresolved links, aliases, block references).

---

## Phase 5 — Vault Loading & File I/O (Rust + Tauri bridge)

**Goal**: the app can open a real folder and read/write real files.

- Rust-side: `fs.rs` commands for read/write/list, `watcher.rs` for file-system watching (external edits from sync clients or other editors)
- Wire the SQLite schema from 4.5 into the Rust side, index built on vault open
- Bridge: Tauri IPC commands the frontend calls to open a vault, list files, read/write a note
- **Debounce file-watcher events** per `PERFORMANCE.md` — rapid external writes shouldn't trigger a reindex per event

**Checkpoint before Phase 6**: open a real folder of markdown files, confirm the app reads them into the index (verify via a debug view or console output — no UI needed yet).

---

## Phase 6 — Editor Integration

**Goal**: CodeMirror 6 wired in, editing a real file, saving back to disk.

- CodeMirror 6 setup with markdown mode, live-preview decorations (raw markdown shown at cursor line, rendered elsewhere — the actual mechanism, not a separate preview pane)
- Wikilink autocomplete + click-to-navigate, using the parser from Phase 4
- Debounced save-to-disk + debounced reindex on edit, per `PERFORMANCE.md`
- Styled entirely through the design system — no ad hoc styles outside tokens

**Checkpoint before Phase 7**: open a note, edit it, confirm it saves to disk and the index updates (backlinks elsewhere reflect the change) without noticeable lag while typing.

---

## Phase 7 — File Tree / Sidebar

**Goal**: navigate the vault visually.

- Virtualized tree view (per `PERFORMANCE.md` — never render thousands of nodes unconditionally) for vaults with many notes
- Built from design-system primitives (list rows, icons — Phosphor, regular weight)
- Click to open in editor (Phase 6)

**Checkpoint before Phase 8**: navigate a multi-folder vault, open notes, confirm smooth scrolling on a large fixture vault (hundreds of files minimum for a real test).

---

## Phase 8 — Backlinks Panel

**Goal**: surface the reverse-link index built in Phase 4.

- Query `links` table for the current note, render as a panel/pane
- Update live as the current note or linked notes change

**Checkpoint before Phase 9**: edit a note that links to another, confirm the backlinks panel on the target note updates correctly.

---

## Phase 9 — Search / Quick Switcher

**Goal**: fast note-finding.

- Start with in-memory title search for the quick switcher (per earlier guidance — don't build full-content FTS until you actually need it)
- Command palette UI via design-system Dialog/Popover primitives

**Checkpoint before Phase 10**: Cmd+K-style switcher opens fast, filters as you type, no lag on a large fixture vault.

---

## Phase 10 — Graph View

**Goal**: visualize the link graph.

- `d3-force` or `react-force-graph`, rendering the graph built in Phase 4
- Cap complexity per `PERFORMANCE.md` — cluster/fade distant nodes rather than rendering everything unconditionally on large vaults

**Checkpoint before Phase 11**: graph renders and is navigable (pan/zoom, click node to open note) without stutter on the fixture vault.

---

## Phase 11 — Settings & Polish

- App preferences (theme toggle if light theme is in scope, editor font selection per the UI-font/editor-font token split)
- Empty states, error states, loading states for all the above — these get skipped under time pressure and shouldn't be

---

## Phase 12 — Performance Audit Checkpoint

**Explicitly required, not optional** — this is the point in the plan where `PERFORMANCE.md`'s rules get checked against reality rather than assumed:

- Re-measure startup time and bundle size against the Phase 3 baseline — flag any regression
- Profile the editor for typing latency, the graph view for render performance, the file tree for scroll performance, all on a large fixture vault
- Confirm debouncing/batching rules from `PERFORMANCE.md` are actually in effect (not just written as intent) across indexing, saving, and search
- Run the bundle-size CI check retroactively if it wasn't already gating PRs by this point

---

## Phase 13 — Release Prep

**Goal**: first real internal build.

- Wire staging deploy channel per `git-ci-release-plan.md` Section 5
- First Changesets version bump for `packages/design-system` and any other versioned packages
- Cut a build to the staging/RC channel, dogfood it yourself for a stretch before considering wider distribution

---

## What's Deliberately Out of Scope for This Plan

- **Mobile app** — separate roadmap, reuses `packages/indexer`, `packages/sync-client`, `packages/design-system` once desktop proves the pattern out (per `mobile-stack-architecture.md`)
- **Sync server** — desktop works fully offline through this entire plan; sync is a distinct feature added after desktop v1 is stable, not a dependency of it
- **Plugin system** — explicitly deferred per earlier decisions, revisit only once core app is solid

---

## How to Actually Run This

- Each phase is multiple sessions, not one. Follow the "one AI change = one commit, one concern" rule from `AGENTS.md` throughout — this plan gives you the sequence, not permission to batch it into fewer, bigger sessions.
- Update `PROGRESS.md` at the end of every session regardless of which phase you're in — "current phase, current step, next up" should always be answerable by reading that file alone.
- Don't skip a checkpoint because a phase "seems done." The checkpoints exist specifically to catch the gap between "component exists" and "component actually works under real conditions" (large vault, real typing speed, real file counts).