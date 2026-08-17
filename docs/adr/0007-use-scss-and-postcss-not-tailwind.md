# ADR-0007: Use SCSS + PostCSS, not Tailwind

## Status
Accepted

## Context
The app's aesthetic (editorial, typography-driven, borders-as-depth, deliberately not the common AI-generated-UI look) doesn't map to utility-class composition. Tailwind's defaults actively fight this direction. A hybrid was rejected too — two styling systems means AI-generated code inconsistently reaches for whichever one first, undermining file-organization discipline.

## Decision
Use SCSS + PostCSS with a design-token layer (SCSS vars + CSS custom properties). No Tailwind, no hybrid.

## Consequences
- Token layer gives the consistency benefit Tailwind would provide, without the utility-class syntax mismatch.
- Styling rules are enforced by Stylelint (e.g. `color-no-hex`, BEM patterns) once tokens are stable.
