# AGENTS.md — Read This First

Conventions for any AI session working on this codebase. Read `PROGRESS.md`, `DECISIONS.md`, and **`PERFORMANCE.md`** alongside this file before starting work. `PERFORMANCE.md` is not optional reading — this app's lightweight/fast requirement is a standing constraint on every decision, not a one-time pass. `PROGRESS.md` is the short current-state file (last session + next up) — consult `docs/HISTORY.md` only for older context. `DECISIONS.md` is a one-line-per-decision index — open the linked file under `docs/adr/` for the full rationale before "fixing" something that looks odd.

---

## Project

A local-first, Obsidian-style note-taking app. Desktop (Tauri v2) + Mobile (Tauri v2 mobile), synced via a manifest-diff sync service. Design system built with SCSS + PostCSS + Storybook, shared across desktop and mobile.

---

## Performance Principle (applies to every decision, every session)

**This app must stay lightweight and fast — always weigh this before adding
any dependency, pattern, or feature.** Concretely:

- Before adding any new package, check its bundle weight (bundlephobia or
  equivalent) — prefer smaller/tree-shakeable alternatives, avoid heavy
  dependencies for small conveniences.
- Prefer native platform APIs over JS libraries where reasonable (e.g. native
  fs/crypto over polyfills).
- Debounce/batch anything that runs per-keystroke (indexing, SQLite writes,
  link parsing) — never do expensive work synchronously on every input event.
- Lazy-load non-critical views (graph, settings, command palette) instead of
  bundling everything into initial load — this applies to desktop too, not
  just mobile.
- When two approaches are otherwise equal, pick the one with less runtime
  overhead, smaller bundle impact, or lower memory footprint.
- Flag any tradeoff where a feature/library adds meaningful weight or startup
  cost — don't add it silently, surface the cost so it's a deliberate choice.

## File Rules

- **Soft cap 150-200 lines per file, hard cap 250.** Enforced via ESLint `max-lines`. Split before hitting the cap, don't wait.
- **One responsibility per file.** One component, one hook, one parser function per file.
- **Banned filenames**: `utils.ts`, `helpers.ts`, `types.ts` at project root. These become dumping grounds — always scope to a feature folder.
- **Colocate types** with the code that produces them. Shared types only in `core/types.ts`, and only when genuinely used across 3+ unrelated modules.
- **File name = primary export name.** No exceptions, no guessing.

## Folder Structure

Feature-first, not type-first:

```
src/
├── components/{Feature}/{Component}.tsx + .module.scss + .stories.tsx + .test.tsx + index.ts
├── indexer/           # parseLinks, parseFrontmatter, buildGraph, search
├── state/              # Zustand stores
└── core/types.ts       # only truly shared types
```

Every module folder gets a barrel `index.ts` re-exporting its public surface. Consumers import from the barrel, not internal files.

## Styling

- **SCSS + PostCSS, no Tailwind.** Design tokens (`tokens/`) are the single source of truth — no raw hex/px values in component styles, Stylelint enforces this once tokens are stable.
- Design principles (non-negotiable): no gradients, no box-shadows, no glassmorphism, no pill badges, no blob illustrations. Depth = borders, not shadows. Editorial/Swiss-influenced, typography-driven, asymmetric layout is fine.
- Every component ships with its `.module.scss` colocated, plus a Storybook story and a test in the **same PR**. No story-less components merged.

- **Class naming: kebab-case, not camelCase** — .card-header, .is-active, not .cardHeader, .isActive. Applies to all SCSS class names project-wide, including CSS Modules.

## Dialog & Modal Design Standard (SettingsDialog Pattern & Less Boxes Always)

Every popup, modal, dropdown menu, or dialog in the application MUST follow the canonical pattern established in `apps/desktop/src/components/SettingsDialog` and `apps/desktop/src/components/EditorArea/EditorMenuBarDropdown`:
- **"Less Boxes Always" Principle**: Never wrap individual choices inside heavy boxed cards, card grids, or nested bordered rectangles. Use unboxed flat list rows with subtle hover backgrounds (`var(--color-bg-hover)`), icon on the left (`16px-18px`), label in the middle, and subtle trailing metadata/chevrons on the right (`CaretRight` or shortcut `⌘K`). Separate sections with hairline dividers (`height: 1px; background-color: var(--color-border-subtle); margin: 6px 0;`).
- **Colors & Shadow**: Background `var(--color-bg-primary)`, floating soft elevation `box-shadow: 0 4px 20px rgb(0 0 0 / 10%)`, perimeter border `1px solid var(--color-border-subtle)`, radius `10px` (`var(--border-radius-md)` / `var(--border-radius-lg)`).
- **Fonts & Padding**: Container `padding: 6px 0;` (or `6px 8px;`); list rows `padding: 7px 14px;` (or `8px 12px;`) with `gap: 10px;`; item text `font-size: 13px; font-weight: 400; color: var(--color-text-normal);`; metadata/shortcuts `font-size: 11px; color: var(--color-text-muted);`.
- **Radix UI Primitives & macOS Window Header**: Built with `@radix-ui/react-dialog` (`Root`, `Portal`, `Overlay`, `Content`). macOS window header with height `44px`, native traffic lights (`Close` red `#ff5f56`, `Minimize` yellow `#ffbd2e`, `Maximize` green `#27c93f`), centered title (`font-size: 13px; font-weight: 600;`), and a `60px` right spacer.
- **Entrance Animations**: `overlay-show` and `content-show` (scaling `0.96` to `1` in `150ms cubic-bezier(0.16, 1, 0.3, 1)`).
- **Follow the Skill/Rule**: Consult `.agents/rules/dialog-design.md` and `.claude/skills/create-dialog/SKILL.md`.

## Preserved User Customizations (Do Not Revoke or Alter)

The user has explicitly customized these design behaviors. All future AI agents MUST preserve them and never revert, re-add removed elements, or alter them:
- **Calendar & Meetings Header Removal (`CalendarLeaf.tsx`, `CalendarView.module.scss`)**: The top header (`.calendar-leaf__header`) with the title "Calendar & Meetings" and icon has been intentionally removed from `CalendarLeaf.tsx` so the view starts directly with the toolbar. Do NOT re-add the header.
- **QuickCapture Footer (`QuickCaptureFooter.tsx`, `QuickCaptureFooter.module.scss`)**: The dialog footer is intentionally simplified to contain only the right-aligned (`justify-content: flex-end;`) "Save note" button. Hints, record button, close button, and quit button in the footer have been intentionally removed (Close and Quit remain in the header). Do NOT re-add them to the footer.
- **Obsidian Theme Border Colors (`docs/references/cm-rules.css`)**: Outline and table border colors are explicitly set to `#ababab`. Preserve these values.

## Database Migrations

- **Never edit an applied migration.** Once a migration file (e.g. `schema.sql` or `1_initial.sql`) has been committed and applied *even once* (including in your own local dev database), you must never edit it again. `tauri-plugin-sql` hashes migration strings; altering an applied migration will cause startup panics (`migration 1 was previously applied but has been modified`).
- Any schema change after initial setup requires a **new** incremental migration file or entry (e.g., v2, v3) in the migration array.

## Working With AI (this doc's actual purpose)

- **Scope every session to one task.** Read `PROGRESS.md`'s "Next up" list, pick one item, do that.
- **One AI change = one commit**, single concern. Don't mix indexer changes with UI changes with schema changes.
- **Before ending a session** (or if running low on context/tokens): update `PROGRESS.md` (Last Session + Next Up) and append full detail to `docs/HISTORY.md`, plus any blockers — don't let state live only in your own context.
- **Non-obvious decisions** get logged as an ADR (new numbered file under `docs/adr/`, appended to the `DECISIONS.md` index), not re-litigated by the next session. Check `DECISIONS.md` before "fixing" something that looks odd — it may be deliberate.
- **Diffs should be small enough to actually read.** If a generation is too big to review line-by-line, ask for it split up.
- **Cutting a Release**: When asked to "create a release" or "ship a beta", follow the release skill runbook in `docs/releasing.md` and `.claude/skills/create-release/SKILL.md`. Always run preflight checks (`preflight-release.sh`) and pause at Human Gate 1 (version/notes approval) and Human Gate 2 (publish confirmation).

## Git Branching & Pull Request Rules (Mandatory for all AI agents)

- **Branch Naming**: ALL branches created by an agent MUST start with one of three prefixes:
  - `feat/<feature-name>` — for new features, components, or enhancements
  - `fix/<bug-description>` — for bug fixes, edge cases, and regressions
  - `chore/<task-name>` — for dependencies, tooling, documentation, refactors, or config
  No branch should ever be created without one of these three prefixes.
- **Push & Pull Request Protocol**:
  - When pushing, the agent must open a Pull Request (e.g. via `gh pr create` or providing the full PR description).
  - **PR Title**: Must be clear and descriptive about what the branch does (e.g. `feat(editor): add math block live preview`).
  - **PR Description**: Must include:
    1. **Summary**: A thorough description of what the PR accomplishes and why.
    2. **ADR Links**: Clickable markdown links to any relevant Architecture Decision Records in `docs/adr/` (e.g. `[ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md)`).
    3. **Commits Breakdown**: Clear breakdown of the commits included in the PR.
    4. **Checklist**: Completed Before Merging Checklist.

## Testing

- Pure logic (parsers, graph builders, sync diffing) gets unit tests — prioritize these, cheap to write, high value.
- Every design-system component gets a Storybook story (all variants/states) + an interaction test.
- Visual regression (Chromatic or Playwright screenshots) gates PRs touching `components/` or `tokens/`.

## Before Merging Checklist

- [ ] File under 250 lines?
- [ ] Correctly located, single responsibility?
- [ ] Types colocated, no raw values outside tokens?
- [ ] Diff small enough to fully review?
- [ ] Commit scoped to one concern?
- [ ] Story + test present for new components?
- [ ] `PROGRESS.md` updated?
