# ADR-0186: Shared tokens, per-platform components

## Status

Accepted

## Context

DaVinci Notes maintains a unified visual identity and design language across platforms.

Desktop uses `@app/design-system`, built with:
- Radix UI unstyled accessible web primitives.
- SCSS Modules and CUBE CSS methodologies.
- CSS custom properties generated from design tokens (`packages/design-system/tokens`).

Mobile (`apps/mobile`) operates under different constraints:
- Mobile requires native navigation transitions, swipe gestures, and virtual keyboard management.
- Web DOM abstractions (Radix UI, HTML DOM elements, CSS Modules) do not run in React Native native views.
- Sharing UI components between webview/desktop and native mobile often leads to compromised ergonomics on both platforms or heavy abstraction layers.

## Decision

1. **Design Tokens as Single Source of Truth**:
   - Design tokens (`packages/design-system/tokens`) define colors, typography scales, spacing, borders, and timing.
   - Tokens are shared across desktop and mobile.

2. **Per-Platform Component Implementation**:
   - Desktop implements components using Radix UI, SCSS Modules, and CUBE CSS within `@app/design-system`.
   - Mobile implements native React Native components (`View`, `Text`, `Pressable`, Expo Router native stacks) within `apps/mobile/components/` and `apps/mobile/app/`.

3. **Desktop-Only Technology Isolation**:
   - Radix UI, SCSS, and CUBE CSS remain desktop-only.
   - `eslint-plugin-boundaries` explicitly forbids `apps/mobile` from importing `@app/design-system` (the web component library).
   - Mobile consumes shared design tokens directly.

## Consequences

- Zero runtime DOM or CSS overhead in native mobile views.
- Mobile components maintain platform-idiomatic feel (iOS HIG and Android Material) while strictly adhering to DaVinci Notes visual identity.
- Clean separation enforced via monorepo lint boundaries prevents web dependencies from accidentally polluting the mobile bundle.
