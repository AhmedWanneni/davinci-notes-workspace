# ADR-0134: AI cloud consent flow

## Status

Accepted

## Context

Because ADR-0133 defers local inference, enabling AI initially means sending
selected vault data to a cloud provider. This is a materially different trust
boundary from local indexing and must not be hidden as an ordinary settings
toggle.

The existing embed security precedent uses a visible placeholder and an
explicit click-to-load action, with fixed scope and no referrer (ADR-0100 and
ADR-0101). AI uses the same interaction principle: explain the boundary before
the action, and require an explicit confirmation.

## Decision

Before cloud mode can be enabled, show a blocking consent screen, not an
already-enabled checkbox. The screen names the selected provider and uses this
copy:

> DaVinci Notes AI sends note text from the AI features you enable to
> **[provider name]** for processing. Semantic search and link suggestions
> may send text from multiple notes to create embeddings. Ask your vault sends
> the selected note excerpts and your question to the provider. Your API key
> is stored in your operating system's secure credential store. DaVinci Notes
> does not receive or store your provider key. Cloud AI is the only AI option
> currently available; on-device AI is not available yet. You can turn this
> off and remove the stored key at any time.

The confirmation action is labeled `Enable cloud AI` and the alternative is
`Not now`. The provider name is not replaced by vague wording such as “AI
service.” The screen is shown again when changing provider or when a feature
would send a new category of data. Disabling cloud AI revokes feature use and
clears the provider key through `AISecretStore.clear`.

## Consequences

Consent is explicit, reversible, and honest about the absence of local
inference. Phase 5/6 error UI can map `AIProviderError` authentication and
network states to reauthentication or retry actions without changing consent
semantics. The screen itself is part of the later feature/settings work; this
phase defines its contract and copy only.
