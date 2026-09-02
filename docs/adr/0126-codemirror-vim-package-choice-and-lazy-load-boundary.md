# ADR-0126: CodeMirror Vim package choice and lazy-load boundary

## Status
Accepted

## Context
Phase 1 of the Vim keybindings integration plan evaluates and establishes the package choice and architectural lazy-load boundary for Vim modal keybindings in the CodeMirror 6 editor.

Per `PERFORMANCE.md`, non-critical features must not bloat the initial application bundle for users who keep settings at their defaults. Optional editor features (such as Vim keybindings) must pay zero bundle cost until explicitly enabled.

## Evaluation & Package Choice
1. **Package**: `@replit/codemirror-vim@6.4.0` (with `@codemirror/search@^6.7.2`).
2. **Maintenance Status**: Active maintenance (version 6.4.0 published August 2026, 32 releases on npm, maintained by Replit and community contributors).
3. **Version Compatibility**: High compatibility. `peerDependencies` target CodeMirror `6.x.x` (`@codemirror/commands`, `@codemirror/language`, `@codemirror/search`, `@codemirror/state`, `@codemirror/view`), matching `@app/editor`'s existing CodeMirror 6 dependency baseline (`@codemirror/view@^6.34.1`, `@codemirror/state@^6.4.1`).
4. **Placement**: Placed inside `@app/editor` (`packages/editor/package.json`), fulfilling ADR-0027 (shared editor package for desktop + mobile). It is not duplicated into `apps/desktop` or `apps/mobile`. `eslint-plugin-boundaries` rule check verified 0 violations.

## Lazy-Load Boundary Design
1. **Dynamic Import Loader**: `packages/editor/vimExtension.ts` exports `loadVimExtension()`, which dynamically calls `import("@replit/codemirror-vim")`.
2. **Compartment Gating**: `Editor.tsx` manages a `vimCompartmentRef` (`Compartment`). When `useVimMode` is false (default stub state), the compartment holds an empty extension `[]`, and `loadVimExtension()` is never invoked.
3. **On-Demand Loading**: When `useVimMode` is true, `loadVimExtension()` resolves asynchronously and reconfigures the compartment on the active CodeMirror view instance without requiring an app restart.

## Verification & Bundle Audit Results
- **Default / Stub OFF (`useVimMode = false`)**:
  - Initial JS bundle footprint for Vim extension: **0 KB** (absent from entry and initial editor bundles; `grep` for `codemirror-vim` in `dist/assets/` yields 0 occurrences).
- **Stub ON (`useVimMode = true`)**:
  - Dynamic chunk emitted by Vite (`vendor-editor-C-XOclW3.js`): **660.58 KB raw** (**223.40 KB gzip**).
  - Fetched and mounted asynchronously on demand.
- **Canvas Text-Card Isolation**:
  - Confirmed Canvas text-cards use native `<textarea>` elements per ADR-0043. Canvas text-cards retain **0 byte footprint** and **0 runtime impact** from this dependency.

## Consequences
- Zero bundle size penalty for users with Vim keybindings disabled.
- Clean dynamic import boundary in `@app/editor` ready for Phase 2 settings wiring.
