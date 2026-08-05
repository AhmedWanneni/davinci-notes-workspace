# PERFORMANCE.md — Standing Rules

**Read this at the start of every session, no exceptions.** This app must
stay lightweight and fast — this is not a one-time optimization pass, it's
a constraint that applies to every line of code, every dependency, every
architectural decision, for the life of the project.

---

## Hard Rules (apply to every session, every PR)

1. **Before adding any dependency**: check its size (bundlephobia or
   equivalent). State the size cost in the PR/commit description. Prefer
   smaller/tree-shakeable alternatives. Never add a heavy library for a
   small convenience — implement it directly if it's simple.
2. **Debounce anything triggered by typing or rapid events** — link parsing,
   indexing, SQLite writes, search-as-you-type, file-watcher reindex. Never
   do expensive work synchronously on every keystroke/event.
3. **Never load the whole vault into memory.** Bounded LRU cache for open/
   recent notes; everything else queried on demand from disk/SQLite.
4. **Lazy-load non-critical views** — settings, graph view, command palette,
   plugin system. Only first-paint-critical code ships in the initial bundle.
   Applies to desktop AND mobile, not just mobile.
5. **Virtualize long lists** — file tree, search results. Never render
   thousands of DOM nodes unconditionally.
6. **Scope state subscriptions narrowly.** A global store update must not
   re-render every open component — use selectors, not whole-store
   subscriptions (Zustand).
7. **Batch writes.** SQLite writes on pause/blur/background transition, not
   per keystroke.
8. **Move expensive computation off the main thread** where reasonable —
   indexing, search, graph layout are Web Worker or Rust-side candidates,
   not main-thread blocking work.
9. **No continuous polling, ever** — sync and any background work use
   foreground/background triggers or bounded OS scheduling, not intervals.
10. **Manifest/hash-diff before content transfer** — never re-send or
    re-process unchanged data.

## Process Rules (how this gets enforced, not just stated)

- **Bundle size check in CI** (`size-limit` or equivalent) — PR fails if it
  grows the bundle past the configured threshold. Don't rely on manual review
  to catch this.
- **Every PR adding a dependency or a new always-loaded module** states its
  size/performance cost in the PR description explicitly — visible tradeoff,
  not a silent one.
- **Profile before optimizing.** When something is slow, measure with
  React DevTools profiler / Tauri devtools first. Don't guess-and-change.
- **Startup budget**: target <500ms to first paint on desktop (set/adjust
  the real number once you have a baseline — see tauri-desktop-setup-prompt.md
  step 5). Treat regressions against the tracked baseline as bugs.
- **Revisit this file explicitly at every major feature addition** — plugin
  system, graph view, and sync are the highest-risk places for scope creep
  to quietly add weight. Re-check against these rules before merging, not
  just at project start.

## Combine With Code Quality — Not a Tradeoff

Performance rules here don't replace `AGENTS.md`'s code-quality rules — they
stack:
- Small, single-responsibility files (AGENTS.md) also make it easier to spot
  where expensive work is happening and to test it in isolation.
- Reviewable diffs (AGENTS.md) make it possible to actually catch a
  performance regression in review instead of missing it in a huge PR.
- Debounced/batched logic should still be pure, testable, colocated — a
  performance fix is not an excuse for a messy one-off file.

If a performance optimization and a code-quality rule seem to conflict,
flag it explicitly rather than silently picking one — usually there's a
way to satisfy both (e.g. a debounce utility that's still a small, tested,
colocated function).