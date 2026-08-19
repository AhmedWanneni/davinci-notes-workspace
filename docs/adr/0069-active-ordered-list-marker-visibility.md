# ADR-0069: Keep Active Ordered-List Markers Visible

## Status

Accepted; supersedes the active-line portion of ADR-0068.

## Context

ADR-0068 kept all list syntax raw on the active editable line. That made an
actively typed ordered marker (`1. ` or `1) `) have no list decoration at all,
which was reported as the number disappearing while starting a list. The raw
source remained in the document, but the live-preview affordance was absent.

## Decision

Render the ordered numeral and delimiter with the existing `ListMarkerWidget`
even on the active editable line. Keep unordered markers and task checkbox
widgets raw on the active line, preserving their established editing behavior.
The ordered replacement covers only the marker range; item text remains a
normal editable CodeMirror document range.

## Consequences

- `1.`, `2.`, and `1)` remain visibly numbered while typing and after focus
  changes, without a second rendering path.
- Unordered bullets, task editing, links, images, and inline formatting retain
  the Phase 5 active-line behavior.
- The change is still a visible-range regex/decorations pass and adds no
  dependency or full-document work.
