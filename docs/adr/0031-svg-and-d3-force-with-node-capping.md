# ADR-0031: Graph view — SVG + d3-force with node capping

## Status
Accepted

## Context
Graph rendering must be smooth at 60fps on large vaults and match the design system's strict CSS-variable styling. `react-force-graph` (Canvas/WebGL) would complicate SCSS token styling.

## Decision
Use `d3-force` (~5.5 KB gzip) for physics simulation and standard **SVG** for rendering. The Global Graph caps rendering to the top 200 nodes by degree.

## Consequences
- Nodes/edges style with existing design-system tokens (`var(--color-bg-overlay)`) and Radix primitives (e.g. `Tooltip`).
- <500 DOM elements including edges; guaranteed 60fps pan/zoom via `d3-zoom`; avoids the "hairball" of thousands of nodes.
