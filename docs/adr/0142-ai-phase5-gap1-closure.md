# ADR-0142: Close AI Phase 5 blocking gap 1

## Status

Accepted; supersedes the gap-1 status in ADR-0140 only

## Decision

ADR-0140's first blocker is closed. `CloudAIProvider` now has a production
HTTP transport, desktop API-key entry validates with a real probe before
saving, and keys are stored only in the Tauri Rust `keyring` namespace
`com.davinci.notes.ai-provider`, matching ADR-0120's OS credential pattern.
Feature consent is persisted as namespaced enabled/disabled values in the
existing SQLite settings table and is independently stored for semantic
search, suggest-links, and ask-your-vault. Disabling consent can clear all
feature states and the key through the existing abstractions.

The dynamic `loadAISubsystem()` boundary remains the only application entry
to these implementations. ADR-0140 blockers 2 and 3, durable retrieved chunk
text and a production source-location opener, remain open and continue to
block ask-your-vault completion.

## Consequences

No `AIProvider` signature change was needed. The missing Phase 0 vendor choice
is recorded as an assumption in ADR-0141, not hidden in feature code.
