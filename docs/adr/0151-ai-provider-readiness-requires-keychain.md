# ADR-0151: AI provider readiness requires its Keychain credential

Status: Accepted

## Context

Provider readiness was stored in SQLite while API keys correctly live only in
the operating-system Keychain. A selected Gemini provider could therefore
retain `ready` after its Keychain entry was unavailable, allowing Q&A to mount
and then fail only when a question was submitted.

## Decision

Treat a cloud provider as ready only when both its persisted provider status
is `ready` and its provider-ID-specific Keychain credential can be loaded.
On a missing credential, downgrade the persisted status to `failed`, hide
consent-gated Q&A, and direct the user to reconnect in Settings. Ollama has no
API key and is exempt from the Keychain check.

## Consequences

SQLite remains limited to non-secret status/configuration. The user must
re-enter an unavailable key; the app cannot and must not reconstruct it from
SQLite or another fallback store.
