# ADR-0104: Embed Web Pages plan closeout

## Status

Accepted

## Decision

Embed Web Pages Phases 1–5 close with the following indexed decisions:

- ADR-0098: fixed `allow-scripts allow-presentation` sandbox, constrained
  `allow`, explicit camera/microphone denial, and `no-referrer`;
- ADR-0099: HTTP(S)-only URL validation with Tauri/internal/local-network
  restrictions and visible rejection;
- ADR-0100/0101: fixed click-to-load behavior and the existing structural HTML
  widget placeholder implementation;
- ADR-0102: only canonical YouTube watch and `youtu.be` forms are converted;
- ADR-0103: X/Twitter statuses use a click-to-load script-free static oEmbed
  card, never `widgets.js` or a tweet iframe.

Canvas remains explicitly out of scope. The existing Canvas package is a
JSON/React Flow card surface; adding web-page cards would require a separate
card model, persistence contract, capability review, and security tests. The
embed policy is not implicitly applied to Canvas.

## Verification

Sanitizer attack-vector tests, integrated editor HTML/embed tests, URL rejection
tests, syntax-sugar near-miss tests, ordinary-image regressions, and the
multi-placeholder benchmark pass. Unloaded placeholders create no iframe or
oEmbed fetch. Real browser network inspection remains a manual verification
step because this repository has no browser-network harness.
