# ADR-0100: Embed pages load on explicit user interaction

## Status

Accepted

## Decision

Validated embeds render a non-network placeholder first. The iframe is mounted
only after an explicit click/activation on that placeholder, and only after
the fixed sandbox, Permissions Policy, referrer policy, and URL checks pass.
Once activated, the iframe remains mounted while the note view is open; it is
not repeatedly remounted by ordinary editor updates. The behavior is fixed in
v1, not user-configurable.

## Rationale

Click-to-load prevents opening a note from silently contacting third parties,
loading trackers, executing remote JavaScript, or consuming WebView resources.
It also keeps ordinary notes on the lightweight path required by
`PERFORMANCE.md`. The explicit action gives users a clear privacy boundary.

## Rejected alternatives

- Eager loading: rejected because note open would trigger network and code
  execution without user intent.
- A global setting in v1: deferred because it adds preference/state surface
  before the security and UX behavior has real usage data; it may be revisited
  with telemetry-free local settings later.
