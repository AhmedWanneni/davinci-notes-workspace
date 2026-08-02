# AGENTS.md — Read This First

Conventions for any AI session working on this codebase. Read `PROGRESS.md` and `DECISIONS.md` alongside this file before starting work.

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

## Working With AI (this doc's actual purpose)

- **Scope every session to one task.** Read `PROGRESS.md`'s "Next up" list, pick one item, do that.
- **One AI change = one commit**, single concern. Don't mix indexer changes with UI changes with schema changes.
- **Before ending a session** (or if running low on context/tokens): update `PROGRESS.md` with what was done, what's left, and any blockers — don't let state live only in your own context.
- **Non-obvious decisions** get logged in `DECISIONS.md`, not re-litigated by the next session. Check it before "fixing" something that looks odd — it may be deliberate.
- **Diffs should be small enough to actually read.** If a generation is too big to review line-by-line, ask for it split up.

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
