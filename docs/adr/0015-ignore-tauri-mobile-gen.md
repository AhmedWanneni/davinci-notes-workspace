# ADR-0015: Ignore Tauri mobile `gen/` output

## Status
Accepted

## Context
Tauri regenerates iOS/Android native project scaffolding via `tauri ios init` / `tauri android init`.

## Decision
Gitignore `apps/*/src-tauri/gen/`. Regenerate locally or in CI when needed.

## Consequences
- Repo stays free of large, churn-heavy generated platform code.
- CI/mobile dev docs should document the regen step.
