# ADR-0150: Ask-your-vault host mount

Status: Accepted

## Context

Phase 5 created the lazy `AskYourVaultPanel` and Phase 6 persisted its
independent consent state, but neither phase provided a production host mount
or entry point. The real settings value `ai.consent.ask-vault=enabled` could
therefore never make the panel reachable.

## Decision

Mount the panel as a fourth section of the existing right sidebar when the
selected provider is ready and `ai.consent.ask-vault` is enabled. The component
is dynamically imported only under that gate; the Q&A package and configured
provider are dynamically imported only after the user submits a question.

The desktop host creates the provider on demand, delegates retrieval and chat
to `askYourVault`, and routes the embedding-store read through the shared
`withDbLock` queue. The existing citation callback/event path remains
unchanged.

## Consequences

The feature now has one discoverable, low-overhead entry point without adding
an icon-rail route or an always-loaded Q&A module. Provider/settings changes
dispatch the existing AI state event so the gate updates without an app
restart.
