---
trigger: always_on
description: Enforce branch naming conventions and Pull Request creation requirements for AI agents.
---

## Git Branching & Pull Request Rules (Mandatory for all AI agents)

### 1. Branch Naming
ALL branches created by any agent MUST start with one of three prefixes:
- `feat/<feature-name>` — for new features, components, or enhancements
- `fix/<bug-description>` — for bug fixes, edge cases, and regressions
- `chore/<task-name>` — for dependencies, tooling, documentation, refactors, or config

Never create a branch without one of these three prefixes.

### 2. Push & Pull Request Protocol
When pushing changes to remote, the agent MUST open a Pull Request (e.g. via `gh pr create`):
- **PR Title**: Must be clear and descriptive about what the changes do (following conventional commit formatting, e.g. `feat(editor): add math block live preview`).
- **PR Description**: Must include:
  1. **Summary**: A thorough description of what the PR accomplishes and why.
  2. **ADR Links**: Clickable markdown links to all relevant Architecture Decision Records in `docs/adr/` (e.g. `[ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md)`).
  3. **Commits Breakdown**: Clear breakdown of the commits included in the PR.
  4. **Checklist**: Completed Before Merging Checklist from `AGENTS.md`.
