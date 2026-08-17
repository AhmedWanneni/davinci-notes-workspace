# ADR-0009: Obsidian dark theme as color baseline

## Status
Accepted

## Context
Design tokens in `packages/design-system/tokens/src/color.json` need starting values.

## Decision
Source color tokens from Obsidian's published dark theme (`#1e1e1e` bg, `#dcddde` text, `#7f6df2` accent). These are starting values, not final brand-locked.

## Consequences
- Validate against a running Obsidian instance before treating tokens as canonical.
- Success/warning semantic colors for Badge are **not yet tokenized**; `Badge.module.scss` uses placeholder hex (`#2ecc71`, `#f1c40f`) until confirmed.
