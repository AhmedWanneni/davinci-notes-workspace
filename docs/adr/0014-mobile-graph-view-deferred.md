# ADR-0014: Mobile graph view scoped down or deferred

## Status
Accepted

## Context
Weaker mobile GPUs + small screens make full force-directed graph rendering a real risk.

## Decision
Default to backlinks-only on mobile for v1; defer full graph rendering.

## Consequences
- Revisit full graph rendering only after validating it's actually needed once the app is in daily use on a phone.
