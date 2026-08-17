# ADR-0010: Storybook 10 — essentials merged into core

## Status
Accepted

## Context
`@storybook/addon-essentials` is empty/deprecated since Storybook 9; controls, actions, and viewport ship in `storybook` core.

## Decision
Remove `@storybook/addon-essentials` from dependencies. Use `storybook/test` for interaction-test imports, not `@storybook/test`.

## Consequences
- Fewer dependencies, aligned with Storybook 10.
- `build-storybook` verified passing.
