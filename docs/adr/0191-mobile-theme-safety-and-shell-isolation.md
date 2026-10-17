# ADR-0191: Mobile Theme Safe Loader Rules and Native Shell Isolation

## Context

On desktop, themes can alter application and editor CSS variables. On mobile, themes must apply inside the editor and reading webviews while preventing security risks (remote exfiltration, unauthorized network requests, script injection) and guaranteeing that custom themes can never compromise the native shell, formatting toolbar, or 44pt touch targets.

## Decisions

### 1. Pure-CSS Safe Loader Rules
All CSS loaded from `<vault>/.davinci/themes/<id>/theme.css` or built-in bundles must pass the safe theme loader before injection into the webview:
1. **Zero Remote Network Access**:
   - Strip and neutralize any `url()` pointing to remote origins (`http://`, `https://`, `//`, `ftp://`).
   - Strip `data:` URI payloads that exceed safety limits or attempt script execution.
2. **Zero Script / Dynamic Execution**:
   - Disallow `@import` statements (`@import url(...)` or `@import '...'`) to prevent secondary remote stylesheet downloads.
   - Block `javascript:`, `expression()`, `-moz-binding`, and HTML `<script>` tags.
3. **Selector Complexity and DoS Guards**:
   - Limit raw CSS payload size to 500 KB to avoid memory bloat.
   - Guard against pathological or excessively deep selector chains (selectors with > 50 combinators or > 1,000 selectors) that could degrade webview frame rates.

### 2. Native Shell and Touch Target Isolation
- **Architectural Boundary**: The mobile application shell (tabs, headers, floating action buttons, formatting toolbar) is rendered using native React Native primitives and NativeWind styling mapped to `@app/design-tokens/mobile`.
- **Zero Cross-Bridge Style Leakage**: Webview CSS cannot cross the native-webview boundary. A theme applied inside the webview `<style>` tag has no mechanism to alter native styles, change button heights, or diminish the 44pt minimum touch target token (`mobileTokens.minTouchTarget = 44`).

## Consequences

- Third-party vault themes can safely customize editor and reading views without network exfiltration or UI denial-of-service.
- The native UI and editing toolbar maintain guaranteed responsiveness and accessibility.
