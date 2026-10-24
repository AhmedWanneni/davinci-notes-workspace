# ADR-0206: Mobile Dynamic Theme Lifecycle and WebView PostMessage Bridge

## Status
Accepted

## Context
Desktop themes in DaVinci Notes are pure CSS files that override public CSS custom properties (ADR-0009, ADR-0163, ADR-0165).
Native React Native views cannot directly apply CSS stylesheets. At the same time, the mobile app hosts webviews (such as the CodeMirror 6 editor in an Expo DOM component, local graph, and canvas) that require CSS variables.
Previously, the mobile app hardcoded `darkColorTokens` across native views, preventing theme switching.

## Decision
1. Implement `NativeThemeTokens` in `apps/mobile/theme/themeTypes.ts` mapping the full token contract to native string and number values.
2. Provide pre-compiled token maps in `apps/mobile/theme/builtinThemeTokens.ts` for all 4 desktop built-in themes:
   - `catppuccin-frappe` (Dark)
   - `catppuccin-latte` (Light)
   - `light-a` (Pure Light)
   - `dark-b` (Pure Dark - Default)
3. Implement `parseThemeTokensFromCss` in `apps/mobile/theme/parseThemeTokens.ts` to extract CSS variables into `NativeThemeTokens` with luminance analysis (`isDarkColor`) and fallbacks.
4. Provide `generateThemeCss` to serialize active `NativeThemeTokens` into a sanitized `:root { ... }` CSS string for webview injection.
5. Create `MobileThemeProvider` (`apps/mobile/theme/MobileThemeProvider.tsx`) and `useTheme()` hook:
   - Synchronous startup cache backed by SQLite `settings` table (`theme.active_id`, `theme.mode`).
   - Automatically synchronizes `expo-status-bar` style (`light` or `dark`).
   - Reactively passes updated `themeCss` to `EditorDom.tsx` without unmounting CodeMirror.
6. Refactor all native primitives (`Text`, `Button`, `IconButton`, `ListItem`, `Sheet`, `Input`, `Badge`, `Divider`) to consume dynamic tokens from `useTheme()`.
7. Implement `ThemeSettingsSection` allowing switching themes and color modes ("System", "Light", "Dark").

## Consequences
- Theme switching is instantaneous across both native views and webviews.
- Zero flicker or CodeMirror re-mount on theme change.
- Strict isolation: CSS parsing ignores remote `url()` and `@import` statements, protecting against malicious theme attacks.
