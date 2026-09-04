# ADR-0145: AI Remediation C citation opener status

## Status

Proposed - blocked

## Context

ADR-0140 requires citations to open the correct note at the relevant source
location. Phase 5 added citation metadata and a UI callback, but the host has
not yet supplied a production note-opening function that accepts a path and
line location.

## Decision

Treat the Q&A panel's `onOpenCitation(notePath, startLine)` callback as the
stable boundary, but do not mark Remediation C closed until the desktop host
connects it to the canonical note opener and verifies the resulting editor
selection/location. The panel must remain honest and expose no fake success
when that callback is not wired.

## Consequences

The citation payload is ready and comes from the transmitted chunks, but
ADR-0140 remains blocked for production acceptance until host navigation is
implemented and tested against a real answer.
