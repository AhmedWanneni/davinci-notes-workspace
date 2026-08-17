# ADR-0044: Canvas edge system constraints

## Status
Accepted

## Context
Canvas edges need visual coherence with the design system, uncluttered handles, editable labels, and no dangling references after deletion.

## Decision
- **Token-constrained palette**: edge colors are a fixed 7-option palette mapping JSON Canvas 1.0 color presets (`"1"`–`"6"`) plus default uncolored to design-system CSS variables (`--color-border-normal`, `--color-text-error`, `--color-text-warning`, `--color-text-success`, `--color-interactive-accent`, etc.) via `canvasEdgeConstants.ts`. No arbitrary color pickers.
- **Handles**: on all 4 card sides via `@xyflow/react` `<Handle />` with `ConnectionMode.Loose`; styled as subtle dots that appear only on hover/selection and are suppressed during text-edit mode.
- **Edge labels**: rendered at the midpoint with `<EdgeLabelRenderer />` and design-system typography; double-click enters inline input (Enter/Escape/blur commits); empty labels render 0 DOM nodes.
- **Cascade deletion**: deleting a node removes all incident edges referencing its ID in `useCanvasNodeChanges.ts`, preventing dangling edge references in `.canvas` files.

## Consequences
- Visual coherence with Obsidian themes; clean files; low DOM overhead for labels.
- 42 canvas tests passing after this phase.
