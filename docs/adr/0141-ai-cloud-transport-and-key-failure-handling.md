# ADR-0141: OpenAI-compatible cloud transport and key failure handling

## Status

Accepted with provider-selection assumption

## Context

ADR-0132 deliberately defined a transport-neutral `AIProvider`, but Phase 0
did not name its first cloud vendor. Ask-your-vault cannot ship on injected
delegates, and provider failures must retain the stable error contract.

## Decision

Implement `CloudAIProvider` with a native `fetch`-based OpenAI-compatible
transport. The default endpoint is `https://api.openai.com/v1`, with
`text-embedding-3-small` for embeddings and `gpt-4o-mini` for chat. Endpoint
and model options remain injectable for compatible providers and tests. No
new HTTP dependency is added.

The transport sends only the request fields defined by `AIProvider` and maps
failures as follows: 401/403 to `authentication` (reauthentication required),
429 to `rate-limited` (retryable), other 4xx to `invalid-request`, 5xx to
`unavailable` (retryable), and fetch failures to `network` (retryable).
Malformed successful responses are `invalid-request`. Key validation uses one
fixed embedding probe and never sends vault content.

This is an explicit assumption filling the missing vendor choice in Phase 0;
the provider endpoint/model can be changed without changing `AIProvider`.

## Consequences

Cloud transport is real and lazy-loadable, while the public API remains
provider-neutral. A future named provider can use the same interface or a
compatible transport. Provider-specific response details do not leak into
feature code.
