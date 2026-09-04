# ADR-0149: AI provider classification and provider-specific consent

Status: Accepted

## Context

The Phase 0 `AIProvider` contract already separates cloud providers from a
local provider and places the AI subsystem behind a dynamic import. Gemini,
OpenRouter, and Ollama extend that architecture without changing existing
provider semantics.

## Decision

- Gemini and OpenRouter are cloud providers. Their enabled feature data is
  described as leaving the device and being sent to the named provider.
- Ollama remains `mode: "local"`, but is classified as local-networked: the
  app talks over HTTP to a user-managed Ollama server, normally
  `http://localhost:11434`, rather than embedding or packaging a model.
- Localhost Ollama does not show the cloud consent screen. The settings UI
  warns when the configured URL is not localhost because the app cannot prove
  that a remote Ollama endpoint keeps data on-device; users should use
  localhost for the local-only guarantee.
- OpenRouter consent explicitly says that OpenRouter forwards requests to the
  selected downstream model provider. OpenRouter's embedding and chat model
  slugs are persisted as provider-specific settings rather than hidden in a
  generic API-key field.
- A stopped or missing Ollama server maps to a distinct
  `local-server-unavailable` provider error, preserving the existing cloud
  authentication and rate-limit failures for cloud providers.
- Each new transport is dynamically imported by its provider factory. The
  runtime barrel exposes factories, not transport classes, so selecting one
  provider does not eagerly bundle the other providers' transport code.

## Consequences

Ollama can be useful without cloud disclosure, but its server address is a
meaningful security/data-flow setting. Remote Ollama use receives a visible
warning rather than an inaccurate claim that processing is local. OpenRouter's
downstream routing is visible at consent time, while model selection remains
explicit and editable in settings.
