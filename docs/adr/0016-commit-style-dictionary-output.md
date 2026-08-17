# ADR-0016: Commit Style Dictionary output

## Status
Accepted

## Context
`packages/design-system/tokens/dist/` (SCSS vars, CSS custom properties, typed TS) is generated from token source JSON.

## Decision
Commit `tokens/dist/` rather than gitignoring it.

## Consequences
- Output is small, human-readable, and useful to diff in PR review when token source JSON changes.
- CI still runs `build:tokens` to verify generated output matches source.
