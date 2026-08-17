# ADR-0032: Graph node labels scale with zoom

## Status
Accepted

## Context
In dense graph clusters, fixed-size labels overlap and become unreadable.

## Decision
Render node title labels as native SVG `<text>` elements inside the zoom-controlled `<g>` container, so they scale with zoom.

## Consequences
- Users zoom into a cluster to read node titles — standard map/graph UX.
- Labels use design-system tokens (`var(--font-ui)`, `var(--type-scale-xs)`).
