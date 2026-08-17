# ADR-0011: Changesets and trunk-based branching

## Status
Accepted

## Context
Monorepo with multiple independently versioned packages; small team.

## Decision
Use Changesets (`@changesets/cli`) for per-package versioning. Use trunk-based branching (main + short-lived PRs) over GitFlow.

## Consequences
- Independent version bumps per package, `CHANGELOG.md` generated.
- Simple workflow that fits a small team.
