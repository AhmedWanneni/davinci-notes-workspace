# ADR-0156: Platform-native custom window chrome

## Status
Accepted

## Context

The note workspace needs its first visible row to carry both navigation and
window affordances, without a separate native title bar. macOS can preserve
the expected traffic-light behavior; Windows and Linux require app-rendered
controls once native decorations are removed.

## Decision

- Build `main` in Rust instead of config so platform window settings stay
  explicit. Keep the established 1200×800 initial and 640×480 minimum size.
- On macOS, use `TitleBarStyle::Overlay`, `hidden_title(true)`, and native
  traffic lights. Their inset is aligned with a 68px sidebar-header spacer;
  custom buttons are deliberately not drawn so the green-button hover menu
  and all platform behavior remain native.
- On Windows and Linux, use `decorations(false)`. Windows enables the native
  shadow option, which gives undecorated Windows 11 windows rounded corners;
  Linux leaves shadow handling to its window manager.
- The sidebar header and the unoccupied tab-strip space have dedicated
  `data-tauri-drag-region` elements. Their double-click handlers call the
  native toggle-maximize command. Interactive children remain outside those
  elements.
- When the left sidebar collapses, its DOM remains preserved per ADR-0040.
  Windows/Linux controls move to the tab-row actions. macOS lights remain at
  their fixed native inset and the tab row reserves the same 68px space.
  The tab strip remains a drag region in either state.
- The current sidebar minimum is 240px; it fits the 96px Windows/Linux
  controls, action row, and a minimum 8px drag target without overlap. No
  sidebar-resize mechanism exists today, so no smaller minimum is supported.
- Modal settings and quick switcher do not hide the sidebar; their overlays
  receive pointer input above the shell and do not become drag regions.
- Capabilities are limited to the native calls used by the chrome:
  `allow-start-dragging` for Tauri drag regions, `allow-close` for close,
  `allow-minimize` for minimize, `allow-toggle-maximize` for double-click and
  restore, `allow-is-maximized` for the maximize-state API contract,
  `allow-is-fullscreen` for the fullscreen spacer hook, and
  `allow-set-fullscreen` for the window fullscreen contract. No wildcard
  capability was introduced.

## Consequences

- No JavaScript or Rust dependency is added. Fullscreen state uses only a
  cleaned-up resize listener and native `isFullscreen()` check; no polling.
- Windows shadow/rounded-corner behavior is selected from Tauri 2.11.5 API
  documentation and still needs direct Windows 11 visual verification.
