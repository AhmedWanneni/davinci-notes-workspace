# ADR-0147: AI Remediation C citation opener closure

## Status

Accepted

## Context

ADR-0145 left Remediation C blocked because the Q&A citation callback had no
desktop host implementation. Citation metadata contains a vault-relative note
path and a 1-based source line.

## Decision

The desktop host handles citation navigation by reusing the canonical
`useWorkspaceStore.openNote` path used by backlinks, search, graph, and
wikilinks. Once the note's existing editor wrapper is ready, the host computes
the cited line's document offset and calls the existing `PluginEditor.setSelection`
method. The editor wrapper remains the only editor boundary; no CodeMirror
object or parallel navigation mechanism is exposed.

The Q&A panel keeps `onOpenCitation` as its callback boundary. When a panel is
mounted without a host callback, it emits the `davinci-ai-open-citation` host
event, which the desktop app routes to the same handler. This keeps the panel
usable across the current lazy integration boundary while preserving the
callback for direct host wiring.

## Verification

`citationNavigation.test.ts` verifies the exact offset for line 119 in a
120-line note and clamps invalid lines. The existing panel test and the new
navigation tests pass: 3 tests across 2 files. Desktop lint and `git diff
--check` pass. A live Tauri click-through could not be performed in this
environment because the app's Q&A panel is exported/lazy-loaded but is not
currently mounted by `App`; the host handler is wired and ready for that
mounting integration.

## Consequences

ADR-0145's callback implementation gap is closed at the host boundary. Full
manual acceptance against a real ask-your-vault answer remains dependent on
the earlier missing Q&A panel mount and real provider acceptance environment.
