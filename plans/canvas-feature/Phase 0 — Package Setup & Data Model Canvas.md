# Canvas Feature: Phase 0 — Package Setup & Data Model

This plan defines the step-by-step implementation for **Phase 0** of the Canvas feature per `plans/canvas-feature-plan.md` and the standing guidelines in `AGENTS.md`, `DECISIONS.md`, and `PERFORMANCE.md`.

---

## User Review Required

> [!IMPORTANT]
> **JSON Canvas Spec Compliance & Ambiguity Flags**:
> - We strictly implement the official **JSON Canvas 1.0** specification (`jsoncanvas.org/spec/1.0/`).
> - The top-level `nodes` and `edges` arrays are optional in the JSON Canvas file format. Our parser will default missing arrays to `[]` while preserving valid empty files.
> - The 4 standard node types (`text`, `file`, `link`, `group`) and standard edges (`fromNode`, `fromSide`, `fromEnd`, `toNode`, `toSide`, `toEnd`, `color`, `label`) are modeled with strict TypeScript discriminated unions.
> - Color values support both Obsidian presets (`"1"` through `"6"`) and hex color strings (`"#rrggbb"`).
> - File I/O uses pure serialization/deserialization with pluggable async file access so that it seamlessly bridges into Tauri's existing `read_note`/`write_note` IPC commands without duplicating filesystem logic.

---

## Proposed Changes

### Monorepo Scaffolding & Configuration

#### [MODIFY] [pnpm-workspace.yaml](file:///Users/ahmedwaanneni/Desktop/davinci-notes/pnpm-workspace.yaml)
- Verify `packages/*` inclusion (already present).

#### [MODIFY] [tsconfig.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/tsconfig.json)
- Add `@app/canvas` path alias pointing to `packages/canvas/index.ts`.

#### [MODIFY] [.eslintrc.js](file:///Users/ahmedwaanneni/Desktop/davinci-notes/.eslintrc.js)
- Register `canvas` element pattern: `packages/canvas/**/*`.
- Configure boundary rule: `canvas` may only import from `core-types` and `design-system`.
- Configure boundary rule: `app` may import from `canvas` (alongside `core-types`, `design-system`, `indexer`, `sync-client`, `editor`).
- Disallow `canvas` from importing from `apps/*`, `services/*`, or `indexer`.

---

### New Package: `packages/canvas`

#### [NEW] [packages/canvas/package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/package.json)
- Package configuration for `@app/canvas` (v0.1.0).
- Dependencies: `@app/core-types: workspace:*`, `@app/design-system: workspace:*`, `@xyflow/react`.
- Scripts: `build`, `lint`, `test`, `typecheck`, `build-storybook`.

#### [NEW] [packages/canvas/tsconfig.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/tsconfig.json)
- TypeScript config extending root `tsconfig.json`.

#### [NEW] [packages/canvas/vitest.config.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/vitest.config.ts)
- Vitest configuration with path aliases for workspace packages.

#### [NEW] [packages/canvas/.eslintrc.cjs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/.eslintrc.cjs)
- Package-level ESLint configuration.

#### [NEW] [packages/canvas/CanvasColor.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasColor.ts)
- `CanvasColor` type (`"1" | "2" | "3" | "4" | "5" | "6" | string`) and helper validators.

#### [NEW] [packages/canvas/CanvasNode.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasNode.ts)
- `CanvasNodeBase`, `CanvasTextNode`, `CanvasFileNode`, `CanvasLinkNode`, `CanvasGroupNode`, `CanvasBackgroundStyle`, and `CanvasNode` discriminated union.

#### [NEW] [packages/canvas/CanvasEdge.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasEdge.ts)
- `CanvasEdgeSide` (`"top" | "right" | "bottom" | "left"`), `CanvasEdgeEnd` (`"none" | "arrow"`), `CanvasEdge`.

#### [NEW] [packages/canvas/CanvasData.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasData.ts)
- Top-level `CanvasData` interface (`nodes?: CanvasNode[]`, `edges?: CanvasEdge[]`).

#### [NEW] [packages/canvas/validateCanvas.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/validateCanvas.ts)
- Schema validator checking required properties, node types, numeric coordinate constraints, and edge endpoint references.

#### [NEW] [packages/canvas/parseCanvas.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/parseCanvas.ts)
- Pure function to parse raw `.canvas` JSON string into validated `CanvasData`.

#### [NEW] [packages/canvas/serializeCanvas.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/serializeCanvas.ts)
- Pure function to serialize `CanvasData` into canonical, formatted JSON string.

#### [NEW] [packages/canvas/canvasIO.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasIO.ts)
- File I/O helpers (`readCanvasFile`, `writeCanvasFile`) with pluggable filesystem adapters (Node `fs/promises` for tests/CLI and Tauri IPC command bridge for desktop).

#### [NEW] [packages/canvas/CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Minimal placeholder view component to establish the lazy-loading entry point for `apps/desktop` before full UI development in Phase 1.

#### [NEW] [packages/canvas/index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/index.ts)
- Barrel export for all types, validators, parsers, serializers, I/O functions, and `CanvasView`.

#### [NEW] [packages/canvas/fixtures/basic.canvas](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/fixtures/basic.canvas)
- Spec-compliant sample canvas fixture with text nodes, file nodes, link nodes, group nodes, and labeled colored edges.

#### [NEW] [packages/canvas/CanvasData.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasData.test.ts)
- Unit tests validating node/edge variant construction, color validation, and edge side/end properties.

#### [NEW] [packages/canvas/parseCanvas.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/parseCanvas.test.ts)
- Unit tests validating parsing, validation error handling on malformed JSON/types, and fixture loading.

#### [NEW] [packages/canvas/canvasIO.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasIO.test.ts)
- Round-trip file I/O test: writes `CanvasData` to disk, reads it back, parses and verifies strict structural equality.

---

### Desktop App Integration & Lazy-Loading Verification

#### [MODIFY] [apps/desktop/package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/package.json)
- Add `"@app/canvas": "workspace:*"` to dependencies.

#### [MODIFY] [apps/desktop/vite.config.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/vite.config.ts)
- Add `@app/canvas` path alias to resolve `packages/canvas/index.ts`.

#### [MODIFY] [apps/desktop/src/App.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.tsx)
- Introduce lazy import boundary (`React.lazy(() => import("@app/canvas").then(m => ({ default: m.CanvasView })))`) as the placeholder route/tab loader for canvas views.

---

### Documentation & Decisions

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Record package placement decision (`packages/canvas` holding data model, I/O, and UI components together mirroring `design-system`).
- Record boundary rule and lazy-loading architecture.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Log Phase 0 completion, boundary check outcome, `@xyflow/react` bundle size metrics, and desktop initial bundle audit results.

---

## Verification Plan

### Automated Tests
1. **Isolated Package Unit Tests**:
   - `pnpm turbo run test --filter=@app/canvas`
   - Validates node/edge construction, JSON Canvas parsing, schema validation, and file I/O round-trip.
2. **Monorepo-wide Tests & Typechecks**:
   - `pnpm turbo run test`
   - `pnpm turbo run typecheck`
3. **ESLint Boundary Enforcement Test**:
   - Deliberately add an import from `apps/desktop` inside `packages/canvas/CanvasNode.ts`.
   - Run `pnpm turbo run lint` and verify ESLint boundary error is triggered.
   - Remove the temporary violation and confirm `pnpm turbo run lint` passes cleanly.
4. **Desktop Web Build & Bundle Size Audit**:
   - `pnpm --filter @app/desktop build:web`
   - `node scripts/check-bundle-size.mjs`
   - Inspect `apps/desktop/dist/assets/` to confirm that `@app/canvas` and `@xyflow/react` are cleanly split into an asynchronous chunk and completely absent from the initial `index-*.js` entry bundle.
