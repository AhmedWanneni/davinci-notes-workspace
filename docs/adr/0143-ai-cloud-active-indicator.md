# ADR-0143: AI cloud-active indicator

## Status

Accepted

## Context

Phase 5 ask-your-vault sends retrieved note excerpts and the user's question
to the cloud provider. A generic enabled state is not sufficient disclosure
during an active request.

## Decision

Use the existing status bar, beside the vault indicator, rather than adding a
new shell region. At rest, persisted cloud consent is shown as `Cloud AI
ready`. During an ask-your-vault request, the label changes to `Cloud AI
transmitting`; it returns to ready on success or failure. The active state is
emitted by the Q&A panel around the actual provider call, covering both query
embedding and chat completion.

The shell reads `ai.consent.cloud` from the existing settings database on
launch and listens for settings changes. It does not default to an enabled
appearance. Revoking cloud consent removes the indicator and disables feature
state.

## Consequences

The indicator is visible where users already inspect app state and separates
availability from data transmission. It does not claim which exact feature is
active; the consent screen and ask-vault UI explain the detailed data flow.
