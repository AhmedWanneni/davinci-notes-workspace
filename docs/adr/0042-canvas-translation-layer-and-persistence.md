# ADR-0042: Canvas translation layer, viewport non-persistence & debounced save

## Status
Accepted

## Context
JSON Canvas schema must stay decoupled from React Flow's internal state, and `.canvas` files must remain spec-compliant for interop with Obsidian.

## Decision
- **Translation layer**: `packages/canvas/canvasTranslation.ts` holds pure mapping functions (`jsonCanvasToReactFlow`, `reactFlowToJsonCanvas`); 100% lossless bidirectional round-trip verified by unit tests across all node types and directional edge attributes.
- **Viewport non-persistence**: `.canvas` files serialize only `nodes` and `edges`. Pan/zoom coordinates are deliberately not written, per the JSON Canvas 1.0 open spec. `fitView` frames content on load.
- **Debounced persistence**: canvas changes serialize to JSON in memory and reuse the existing 750 ms debounced disk saving (`saveNoteNow`) established for markdown notes.
- **Native vault support**: Rust `fs.rs`/`watcher.rs` discover and monitor `.canvas` files alongside `.md`; sidebar "New canvas" writes a spec-compliant `{ "nodes": [], "edges": [] }` file.

## Consequences
- Strict spec interop with Obsidian and other JSON Canvas tools.
- One persistence path for both markdown and canvas files; no per-keystroke/per-frame I/O.
