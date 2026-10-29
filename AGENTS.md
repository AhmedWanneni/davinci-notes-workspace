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

## Database Migrations

- **Never edit an applied migration.** Once a migration file (e.g. `schema.sql` or `1_initial.sql`) has been committed and applied *even once* (including in your own local dev database), you must never edit it again. `tauri-plugin-sql` hashes migration strings; altering an applied migration will cause startup panics (`migration 1 was previously applied but has been modified`).
- Any schema change after initial setup requires a **new** incremental migration file or entry (e.g., v2, v3) in the migration array.

## Working With AI (this doc's actual purpose)

- **Scope every session to one task.** Read `PROGRESS.md`'s "Next up" list, pick one item, do that.
- **One AI change = one commit**, single concern. Don't mix indexer changes with UI changes with schema changes.
- **Before ending a session** (or if running low on context/tokens): update `PROGRESS.md` (Last Session + Next Up) and append full detail to `docs/HISTORY.md`, plus any blockers — don't let state live only in your own context.
- **Non-obvious decisions** get logged as an ADR (new numbered file under `docs/adr/`, appended to the `DECISIONS.md` index), not re-litigated by the next session. Check `DECISIONS.md` before "fixing" something that looks odd — it may be deliberate.
- **Diffs should be small enough to actually read.** If a generation is too big to review line-by-line, ask for it split up.

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
