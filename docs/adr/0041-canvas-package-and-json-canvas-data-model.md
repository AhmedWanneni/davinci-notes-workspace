# ADR-0041: Canvas package & JSON Canvas 1.0 data model

## Status
Accepted

## Context
The canvas feature needs a home for data model, file I/O, and future React Flow view components, and must not bloat the initial bundle.

## Decision
- **Unified package**: data model, JSON Canvas file I/O, and React Flow view components live together in `packages/canvas` (scoped `@app/canvas`), mirroring `packages/design-system` and `packages/editor`.
- **Strict JSON Canvas 1.0 compliance**: models adhere directly to `jsoncanvas.org/spec/1.0/` without custom extensions. Top-level `nodes`/`edges` are optional (default `[]` in memory). Discriminated unions model `text`, `file`, `link`, `group` nodes; preset colors `"1"`–`"6"` and hex `#...` are supported.
- **Boundary enforcement**: ESLint `eslint-plugin-boundaries` element `canvas` (`packages/canvas/**/*`, `mode: "full"`) restricted to `@app/core-types` and `@app/design-system` only; dependencies on `apps/*` or `packages/indexer` forbidden (verified with a temporary violation that failed the build).
- **Lazy-loading**: `@app/canvas` and `@xyflow/react` (~55 KB min+gzip) load on demand via dynamic `import("@app/canvas")` (`React.lazy`) in `EditorArea.tsx` when a `.canvas` file opens.

## Consequences
- Initial desktop entry chunk contains **0 KB** of canvas/React Flow code; entry stays at 21.08 KB raw / 7.71 KB gzip.
- Reuse direct for desktop/mobile without premature package fragmentation.
