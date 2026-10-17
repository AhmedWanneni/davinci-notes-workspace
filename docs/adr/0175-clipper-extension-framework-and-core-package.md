# ADR-0175: Clipper extension framework, location, and shared core package

## Status

Proposed (needs owner input, see "Open decisions"). Draft only; no code.

## Context

The clipper is a browser extension, not part of the desktop webview. It must live
in this monorepo but obey `eslint-plugin-boundaries`, and it must share its
template engine/types with the desktop app so a future "clip from URL" command
inside the app can reuse them (not a second engine).

Target browsers, in order: Chrome / Edge / Brave / Arc (Chromium MV3) first,
Firefox second, Safari later.

Current workspace facts:
- `pnpm-workspace.yaml` already globs `apps/*` and `packages/*`.
- `tsconfig.json` maps `@app/*` to `packages/*/index.ts`.
- `.eslintrc.js` has one element `{ "type": "app", "pattern": "apps/**/*" }`
  allowed to import `core-types, design-system, indexer, sync-client, editor,
  canvas, plugin-api, plugin-runtime, theme-api, ai-api, ai-runtime, app`. A new
  package needs its own element entry, and the extension must be prevented from
  importing desktop/Tauri-only packages.

## Options

### A — Plain Manifest V3 + a hand-rolled build (Vite/esbuild)

- Pros: fewest tools; full control of the manifest; no framework knowledge to
  learn.
- Cons: per-browser manifest authoring, MV2/MV3 divergences, and the
  `webextension-polyfill` glue are all manual; slower iteration.

### B — WXT (`wxt`)

- Verified: WXT v0.21.4, MIT, "build extensions for Chrome, Firefox, Edge, Safari,
  and any Chromium based browser", MV2 and MV3 from one codebase, Vite-based,
  file-based entrypoints, TypeScript by default, and automated zip/publish.
- Pros: one codebase for Chromium + Firefox + (later) Safari; Vite matches the
  desktop app's bundler; file-based entrypoints keep the manifest out of our
  code; MIT. It is a **build-time** dependency — it ships nothing into the
  extension runtime.
- Cons: another toolchain in the monorepo; WXT has opinions (auto-imports) that
  must be configured off to match our explicit-import style.

## Decision (recommended)

- **Location:** new `apps/web-clipper` (an `app`), Chromium MV3 first.
- **Framework:** **WXT** (Option B), configured to disable its auto-import magic
  and to keep manifests minimal.
- **Shared package:** new `packages/clipper-core` — **pure TypeScript, no DOM,
  no Tauri, no React, no network**, holding: the payload schema and types, the
  template engine (variables, filters, render), `safe_name`, note-name/daily-note
  resolution, and template validation. Both the extension and the desktop app
  import it.
- **Boundaries:** add elements
  `{ "type": "clipper-core", "pattern": "packages/clipper-core/**/*" }` and a
  distinct `{ "type": "web-clipper", "pattern": "apps/web-clipper/**/*" }`
  **before** the generic `app` element. Rules: `clipper-core` may import only
  `clipper-core` (plus `core-types` if genuinely shared); `web-clipper` may
  import only `clipper-core`, `core-types`, and `design-system` — explicitly **not**
  `editor`, `canvas`, `indexer`, `sync-client`, Tauri packages, or the desktop
  app. `app` gains `clipper-core` in its allow list.
- **Design system:** the popup consumes `@app/design-system` tokens only; it does
  not import desktop components.

## Consequences

- One engine, two consumers; the future in-app "clip from URL" needs no new
  engine. `clipper-core` stays testable in isolation (AGENTS.md: pure logic gets
  unit tests).
- The boundary rules must be extended in the same commit as the packages, or the
  lint gate will not enforce the separation.
- WXT is dev-only; the shipped extension carries only `clipper-core` + extraction
  + UI.
- If WXT's opinions prove disruptive, the fallback is Option A (plain MV3) — the
  rest of this plan is unaffected because only the build tooling changes.

## Performance cost

- Runtime: none added to the desktop app. Extension runtime cost is
  `clipper-core` (small, pure) + extraction (ADR-0174) + popup UI.
- Build-time: WXT pulls Vite + its own tooling into the workspace; it is not
  shipped. Install-size impact should be recorded in the Phase 2 PR.

## Open decisions

- Confirm WXT over plain MV3.
- Confirm `clipper-core` is dependency-free (reuse `@app/indexer`'s `yaml` only
  if frontmatter *parsing* is ever needed; *emission* must be string templating).
