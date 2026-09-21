# ADR-0163: Public theme scrim token

## Status

Accepted

## Decision

Add `--color-bg-scrim` to the public theme contract. It is the full CSS color
value, including alpha, used only by viewport-covering modal/dialog backdrops.
The default dark value is `rgb(0 0 0 / 60%)`; light themes must provide their
own appropriate alpha-bearing value.

`--color-bg-overlay` is rejected as ambiguous: popovers and menus are
surfaces, while a scrim specifically dims content behind a modal. Existing
surface and interaction tokens do not express this role.

`--color-border-strong` is not added. Search-dialog framing maps to the
existing `--color-border-normal`; this deliberately collapses an undefined
legacy distinction rather than expanding the permanent theme API.

## Consequences

All application and design-system dialog backdrops must use this token. Theme
authors receive one stable semantic scrim override; no dependency or runtime
work is added.
