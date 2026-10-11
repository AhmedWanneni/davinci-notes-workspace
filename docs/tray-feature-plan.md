# Menu Bar / System Tray Feature Plan

Overview of the system tray implementation for DaVinci Notes.

## Status Summary

- **Phase 1: Static Menu Bar Icon** — Complete (macOS monochrome menu bar template icon with Show/Hide, New note, Quit).
- **Phase 2: Close to Tray & Unified Clean Quit** — Complete ("Keep running in menu bar" toggle, window close interception, clean quit synchronization across all exit paths).
- **Phase 3: Dynamic Menu** — Complete (Last 5 recent notes with folder collision disambiguation, Today's daily note, Open vault, 200ms debounced updates, 0 polling at rest).
- **Phase 4: Global Shortcut & Lazy Quick Capture** — Complete (`Control+Alt+N`, lazy isolated `capture.html` window, safe append-only note writing, vault root confinement).
- **Phase 4a: Save-Time External-Change Guard** — Complete (ADR-0170 superseding ADR-0161: pure append merges losslessly, conflict detection with banners and conflict copy preservation).
- **Phase 4b: Click-to-Capture Popover & Setting** — Complete (ADR-0172: Left-click toggles quick capture popover anchored under icon with work-area clamping, right-click opens menu, 350ms blur/click debounce race suppression, in-memory draft preservation, "Menu bar icon click" setting).
- **Phase 5: Quick Search in Capture Window** — Complete (ADR-0171: FTS5 BM25 search in capture window via scoped SQL permissions, WAL mode concurrency, native note jump).
- **Phase 6: Sync Status in Tray Menu** — Deferred (client daemon not yet active in desktop).
- **Phase 7: Settings Consolidation & Audit** — Next up.

## Phase 4b Details: Tray Click-to-Capture Popover

### Goals & Implementation
1. **Left-Click Popover Anchoring**: Left-clicking the menu bar icon toggles the Quick Capture window, positioned directly beneath the icon (on macOS/top menubars) or directly above (on Windows bottom taskbars).
2. **Work Area Clamping (`tray_position.rs`)**: Window is centered under the icon and clamped strictly to the monitor's work area with an 8px margin, preventing any off-screen positioning on primary or secondary screens.
3. **Blur/Toggle Race Elimination**: Capture window records its blur timestamp on `WindowEvent::Focused(false)`. If a tray left-click event fires within 350ms of a blur event, it is treated as part of the click-to-dismiss sequence and does not re-open the window.
4. **Draft Text In Memory**: Unsaved typed text in Quick Capture is kept in React state in memory across blur, Escape, and mode toggles. It is only cleared upon successful save (`quick_capture_save`) or app quit.
5. **Configurable Left-Click Action**: "Menu bar icon click" setting in General Settings:
   - "Open quick capture" (`capture`, default for new users).
   - "Open menu" (`menu`, default fallback for existing users).
   - Live update via `set_show_menu_on_left_click` with zero restart.
   - Hidden on unsupported platforms (e.g. Linux).
