# ADR-0038: CUBE CSS for desktop styling

## Status
Accepted

## Context
`apps/desktop` styling moved beyond isolated per-component hashing; the app layer needs the design-system token inheritance and thin-block philosophy.

## Decision
Migrate `apps/desktop` from CSS Modules to **CUBE CSS** (Composition, Utility, Block, Exception) with a structured global SCSS architecture (`src/styles/` with `base/`, `layout/`, `components/`, `utilities/`, `lib/`, and a single `_main.scss` entry point).

## Consequences
- Desktop-local blocks in `components/` use strict BEM selectors (`.file-tree`, `.file-tree__row`), enforced by a Stylelint `selector-class-pattern` rule.
- State variations use Radix accessible data attributes (`data-state`, `data-active`, `data-size`, `data-selected`) instead of dynamic React classes.
- Zero-dep `cn()` helper (`src/styles/cn.ts`) supports CUBE bracket grouping notation in TSX.
- Gzipped total CSS reduced from 8.05 KB to 6.60 KB with zero runtime JS style recalculation.
