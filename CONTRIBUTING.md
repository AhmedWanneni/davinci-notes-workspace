# Contributing Guidelines

## Branch Naming
Use standard prefixes for branch names matching your concern:
- `feat/`: New feature
- `fix/`: Bug fix
- `chore/`: Maintenance, config changes
- `refactor/`: Code refactoring without behavioral changes
- `docs/`: Documentation updates

## Commit Conventions
All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format enforced by commitlint:
- `feat(scope): ...`
- `fix(scope): ...`
- `chore(scope): ...`

## Pull Request Rules
- All PRs must target `main`.
- CI status checks must pass (linting, typechecking, tests, build, boundary checks).
- At least 1 review is required.
- Maintain single-concern PRs.
- Keep file sizes under the 250-line hard cap (per `AGENTS.md`).
