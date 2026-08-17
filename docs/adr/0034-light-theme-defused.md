# ADR-0034: Light theme defused for v1

## Status
Accepted

## Context
Design tokens only reflect the baseline Obsidian dark theme. Adding a broken or partially-functioning theme toggle before light tokens exist would violate UI-polish standards.

## Decision
Intentionally omit a "Light / Dark" theme toggle from settings for v1. The app remains dark-first.

## Consequences
- Light theme ships only once light design tokens exist (out of scope until then).
