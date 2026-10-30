# GitHub Copilot Instructions — DaVinci Notes (Sophia)

## Core Guidelines
- Read `AGENTS.md`, `DECISIONS.md`, and `PERFORMANCE.md` before making changes.
- Soft cap: 150–200 lines per file; hard cap: 250 lines (`max-lines`).
- Colocate types with implementations; avoid dumping shared types at root.
- Universal SQLite lock discipline: wrap indexer database queries in `withDbLock` ([ADR-0168](docs/adr/0168-vault-index-write-lock-contention-and-universal-lock-discipline.md)).
- Never edit applied database migrations ([ADR-0035](docs/adr/0035-never-edit-applied-migration.md)).

## Release Orchestration
When prompted to cut or create a release:
- Follow [`docs/releasing.md`](docs/releasing.md).
- Use `scripts/release/preflight-release.sh` to verify working tree and manifest sync.
- Propose SemVer bump and draft changelog via `scripts/release/generate-changelog.sh`.
- Require user confirmation at Human Gate 1 (version approval) and Human Gate 2 (publish confirmation).
- Execute version tagging via `scripts/release/release.sh`.
- Monitor artifacts via `scripts/release/wait-and-verify-release.sh`.
- Publish via `gh release edit <tag> --draft=false`.
