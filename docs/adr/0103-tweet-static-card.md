# ADR-0103: Tweet embeds use a script-free static card

## Status

Accepted

## Context

Phase 4 must not load X/Twitter's `widgets.js` into the app document. X's
official oEmbed API returns HTML intended to be transformed by that JavaScript;
the embedded-post documentation describes the blockquote-plus-script model.
The HTML alone is not the finished tweet widget. Loading the script in the
app page would bypass the iframe sandbox policy, while placing the script in a
sandboxed iframe would introduce a second remote application with uncertain
compatibility and still require extra permissions/cookies.

## Decision

Use a script-free static tweet card. On explicit activation, fetch X's public
oEmbed JSON endpoint with `omit_script=1` and `dnt=true`. The renderer extracts
only text-safe metadata (`author_name`, `author_url`, and text content from the
returned HTML) and renders it with local DOM elements and design tokens. The
card includes a normal link to the original status. Returned HTML is never
assigned to `innerHTML`, and no third-party script or iframe is created.

The fetch follows Phase 1 click-to-load behavior: opening a note performs no
tweet request; activation starts one request. Errors render a visible fallback
card with a link to the status.

## Investigation and rejected alternative

Option (a), an oEmbed response inside the Phase 2 iframe, was investigated and
rejected. X documents that its oEmbed markup is automatically recognized only
when the X widget JavaScript is included, and the embedded-post documentation
describes `widgets.js` as the transformer. Option (b) is less visually rich but
keeps remote code out of both the app document and the iframe trust boundary,
which matches the local-first privacy model.

## Consequences

- Tweet content is a stable, reviewable local rendering with no X-controlled
  JavaScript execution.
- Styling and interactive media are intentionally limited; the source status
  link remains available for the complete native experience.
- oEmbed response shape or availability changes degrade to the visible link
  fallback rather than creating an unsafe rendering path.
