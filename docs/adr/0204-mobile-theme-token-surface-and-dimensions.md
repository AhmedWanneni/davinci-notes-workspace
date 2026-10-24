# ADR-0204: Mobile Theme Token Surface and Layout Dimensions

## Status

Accepted

## Context

The mobile shell (`apps/mobile`) operates with native React Native primitives and Expo DOM components for CodeMirror 6 (ADR-0185, ADR-0186). While desktop consumes CSS custom properties declared in `@app/design-system` and `@app/theme-api`, mobile native views require typed token objects (`NativeThemeTokens`).

To support the Obsidian-parity layout (capsule switcher, grouped action cards, 44pt touch boundaries) and provide rich visual theming, mobile needs:
1. Well-defined layout dimension tokens that map to the public token contract without mutating the desktop web values.
2. Direct native token definitions for the four standard built-in themes (`catppuccin-frappe`, `catppuccin-latte`, `light-a`, `dark-b`).
3. Seamless fallback and parsing for custom vault themes installed under `<vault>/.davinci/themes/`.

## Decisions

### 1. Mobile Public Layout Dimensions Contract
The following layout dimension variables are established for mobile surfaces:
- `--radius-capsule`: default `9999px` (for search/switcher pill capsules).
- `--radius-sheet-group`: default `12px` (for internal grouped action cards in bottom sheets).
- `--space-touch-target`: default `44px` (minimum accessible touch bounding box per HIG/Material).

### 2. Pre-Compiled Built-in Themes Token Maps
Mobile ships pre-compiled `NativeThemeTokens` objects for the four canonical desktop-parity built-in themes:
- `catppuccin-frappe` (Dark, pastel Catppuccin palette)
- `catppuccin-latte` (Light, soft Catppuccin palette)
- `light-a` (Neutral light paper theme)
- `dark-b` (High-contrast OLED black theme)

### 3. Safe CSS Custom Property Extraction
Custom vault themes (`<vault>/.davinci/themes/<id>/theme.css`) are parsed using a zero-dependency regex extractor that resolves `:root` CSS custom properties against the default token contract. Only declared public variables from `packages/theme-api/PUBLIC_TOKENS.md` are accepted; unknown selectors or rules are safely ignored by native views while preserved for webviews.

## Consequences

- Mobile native views can switch themes with zero network overhead, zero CSS-in-JS runtime bloat, and zero startup flicker.
- Desktop CSS variables remain 100% untouched with zero-diff regression.
- Visual alignment with the four built-in desktop themes is guaranteed.
