# ADR-0039: Staging deploy channel & release-candidate strategy

## Status
Accepted

## Context
Need internal dogfooding builds that don't affect public production releases.

## Decision
- **Staging channel workflow**: `.github/workflows/staging-release.yml` triggers on `main` push and manual dispatch, building native desktop staging artifacts behind Turborepo quality gates and size-budget enforcement.
- **Feed endpoints**: staging builds target `https://staging.updates.davincinotes.com/{{target}}/{{current_version}}` (distinct from future `stable.updates.davincinotes.com`).
- **Code signing**: GitHub Actions secret bindings for macOS Apple Developer ID notarization and Windows Authenticode, with graceful fallback to ad-hoc local signing when secrets are absent.
- **Promotion rule**: a release candidate (e.g. `v0.1.0-rc.1`) produces binary artifacts that are tested directly; when it passes, the exact same binary is promoted to stable rather than rebuilt from source.

## Consequences
- Independent dogfooding without affecting production.
- Unsigned internal builds require documented Gatekeeper bypass steps.
