# ADR-0132: AI provider abstraction and lazy-load boundary

## Status

Accepted

## Context

AI features need embeddings and chat completion, but the provider mechanism
must not encode semantic search, suggest-links, or ask-vault behavior. AI is
optional and must not affect the default startup bundle or runtime path.

## Decision

Define `@app/ai-api` around two modality operations: `embed` accepts a batch of
strings and returns vectors; `complete` accepts chat messages and returns text.
`AIProvider` also exposes `mode`, capabilities, and disposal. `CloudAIProvider`
and `LocalAIProvider` in `@app/ai-runtime` delegate to injected operations;
they contain no model or network implementation in Phase 0.

Failures use `AIProviderError` with stable codes: `authentication`,
`rate-limited`, `network`, `unavailable`, and `invalid-request`. Each error
declares whether retry is appropriate and whether reauthentication is
required. Later phases must preserve these states rather than infer them from
provider-specific HTTP errors.

API keys are supplied through an `AISecretStore` abstraction. The desktop
implementation must follow ADR-0120's existing Tauri Rust `keyring` adapter
pattern, using a separate service/account namespace for AI providers. Keys
must never be put in localStorage, SQLite settings, or ordinary files.

The subsystem entry point is [loadAISubsystem.ts](../../apps/desktop/src/ai/loadAISubsystem.ts),
which uses a genuine dynamic `import("./AISubsystem")`. No app startup module
imports it. Future AI UI or feature code must use this entry point or a
downstream `React.lazy` boundary; a static import guarded by a boolean is not
an acceptable substitute because it still places the module in a bundle.

## Verification

The contract tests cover stable authentication error state and the modality
surface. The desktop production graph has no import of `loadAISubsystem`, so
the subsystem is unreachable until a future user-triggered feature loads it.

## Consequences

Provider implementations remain replaceable and feature-neutral. Phase 1 can
add embedding transport/model code without changing the public provider
methods. The loader currently has no user-facing trigger by design; adding one
belongs to the first AI feature phase.
