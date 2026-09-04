# ADR-0135: Granular AI feature consent

## Status

Accepted

## Context

The three planned features have different data behavior. Semantic search
processes a broad note corpus, suggest-links processes note relationships and
candidate text, and ask-vault sends selected context plus a question. One
global switch would force users to accept the broadest data flow to use the
least invasive feature.

## Decision

Use granular consent after the blocking cloud-consent screen. Users can enable
semantic search, suggest-links, and ask-vault independently. Each feature's
confirmation names the data it sends and the provider that receives it.
Cloud consent is a prerequisite for any feature, but it is not sufficient by
itself to activate all features.

## Downstream implications

- Phase 1 embedding infrastructure must checkpoint consent before indexing or
  uploading note text, and must not build a remote index for a disabled
  feature.
- Phase 3 suggest-links must have its own enable/disable state and consent
  checkpoint because it may process note pairs or candidate excerpts.
- Phase 4 ask-vault must have its own checkpoint immediately before sending a
  question and selected context; enabling semantic search must never imply
  chat consent.
- Phase 5/6 failure and settings flows must preserve each feature's state,
  show provider/key failures without silently enabling another feature, and
  make global cloud disable turn all feature states off.

## Consequences

There are more settings states and consent copy than with a coarse switch, but
the privacy boundary matches the actual data flows. Later phases must reuse
these checkpoints rather than collapsing them for UI convenience.
