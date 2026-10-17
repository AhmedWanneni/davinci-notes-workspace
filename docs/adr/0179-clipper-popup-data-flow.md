# ADR-0179: Web Clipper popup data flow — split pipeline, draft vs payload

## Status

Accepted.
Implemented in Phase 2b: preparation (`prepareClipContext`) split from rendering (`renderClipPayload`), draft state isolated from payload sanitization.

## Context

Phase 2b replaces the unstyled popup with a React popup on `@app/design-system`
(template picker, editable target and frontmatter, Markdown preview). Two costs
appear only once the UI can change things, and both have a single obvious first
implementation that is wrong:

1. **Template switching re-extracts the page.** The Phase 2a pipeline had one
   entry point, `runClipSession`, which matched a template and rendered it. The
   popup needs the template *and* the mode to be changeable after the page has
   already been read. Re-running the whole pipeline per change re-parses the DOM
   and re-runs Defuddle: measured in jsdom at 3,085 ms for a 1.43 MB page, so a
   few template clicks on a heavy page would freeze the popup.
2. **Sanitising an editable field fights the typing.** The clip's note name and
   folder need to be sanitised (defence in depth; ADR-0177 re-validates on the
   desktop), but if the field's value *is* the sanitised value, then typing
   `../` disappears as it is typed and `.md` is appended mid-word.

## Decision

**One split, two consequences.**

1. **Preparation is separate from rendering.** `prepareClipContext` (page, DOM,
   mode → snapshot, extraction, variables) runs once per (document, mode);
   `renderClipPayload` (context + template → payload) runs per template. The popup
   memoises each independently, so changing the template re-renders and changing
   the mode re-prepares, and neither re-reads the page. The one-shot composition
   (`runClipSession`, `buildClipFromPage`) is deleted rather than kept alongside:
   with the popup as the only caller, a second entry point would be dead code that
   drifts.
2. **The fields show a draft; the payload is what the draft sanitises to.**
   `ClipDraft` (`buildClipDraft`) is the payload with the user's raw typing laid
   over it, and is what the inputs render. `applyClipEdits` produces the payload
   that is written: paths stripped of separators and `..` segments, a leading dot
   removed, `.md` ensured, characters no filesystem accepts removed, and a property
   field emptied by the user removed from the frontmatter rather than written as
   an empty value.
3. **List-valued properties are shown, not editable.** A field holding
   `["Ada", "Grace"]` would have to guess whether the user's comma is a separator
   or part of a value. A silently misinterpreted frontmatter value is worse than
   one that cannot be edited in the popup.

`contentHash` is deliberately *not* recomputed on an edit: it hashes the body
(ADR-0178 dedupe) and the body is not editable in the popup.

## Consequences

- The popup switches templates without re-extracting; only a mode change pays the
  extraction cost again.
- Sanitisation lives in one pure, unit-tested function (`applyClipEdits`) rather
  than in the React layer, so the desktop's validation has a matching counterpart
  that is easy to read side by side.
- Editing a target adds no new upload or file permission: the note still leaves the
  extension through the `downloads` API until Phase 3.
- Two shapes for the same data (`ClipDraft`, `ClipPayload`) is more code than one,
  and that is the cost being accepted: the alternative conflates "what the user is
  typing" with "what may be written to a vault".

## Open decisions

- Whether the desktop should accept a clip whose note name the popup sanitised
  into the fallback `Untitled.md`, or reject it so the user is told (O5 pairing UX
  / error surfaces).
- Whether property editing should support list values (comma-separated input,
  multi-line input, or not at all) — see §10 of the plan.
