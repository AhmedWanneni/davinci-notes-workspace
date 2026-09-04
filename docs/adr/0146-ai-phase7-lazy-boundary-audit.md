# ADR-0146: AI Phase 7 lazy-boundary audit

## Status

Accepted

## Decision

The initial Vite entry must contain no AI provider, transport, embedding,
vector, settings-panel, Q&A, or cloud-indicator implementation. The existing
settings and status-bar shell may contain only conditional dynamic-import
boundaries and the minimal persisted boolean needed to decide whether an
optional indicator should load. AI implementation modules remain in deferred
chunks and are loaded only after the relevant user action/state.

The Phase 7 audit measured the initial entry at 363,212 raw bytes / 114,995
gzip bytes. Deferred AI-related chunks measured 8,139 bytes for the subsystem,
3,092 bytes shared support, and 276 bytes for the indicator. This preserves
the lightweight startup path without adding a dependency.

## Consequences

The first paint pays no AI implementation cost. Settings and indicator code
remain available through user-triggered dynamic boundaries. Future AI work
must repeat the same entry-symbol check when adding a new surface.
