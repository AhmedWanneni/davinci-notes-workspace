# ADR-0172: Tray Click-to-Capture Popover and Left-Click Setting

## Status

Accepted (supersedes Phase 1 "menu opens on left click" decision)

## Context

In Phase 1 of the menu bar / tray feature, left-clicking the tray icon opened the native tray menu (`Show/Hide`, `New note`, `Quit`). As the app added Quick Capture (Phase 4) and Quick Search (Phase 5), opening a menu on every click added friction to high-frequency note capture.

Phase 4b transitions the tray icon to serve as an instant, anchored popover launcher for Quick Capture while preserving full reachability of the tray menu and protecting existing user muscle memory.

Architectural and UX challenges:
1. **Focus/Blur & Toggle Races**: Clicking a focused always-on-top window's tray icon causes the OS to fire a window blur event (`WindowEvent::Focused(false)`) immediately before the tray icon click event. If blur hides the window synchronously, the click handler arrives, observes the window as hidden, and immediately reopens it (causing flicker).
2. **Multi-Monitor and Work Area Clamping**: The popover must anchor directly beneath the tray icon on macOS/top menu bars, above the taskbar on Windows bottom taskbars, adjust for Retina DPI scaling (e.g. 2.0x vs 1.0x), and strictly clamp to the work area bounds so it never renders off-screen or straddles display edges.
3. **No Heavy Dependencies**: Introducing `tauri-plugin-positioner` adds binary weight and multi-monitor edge-case bugs in Tauri v2.
4. **Draft Safety**: Typing a quick note and accidentally clicking away should not destroy typed thoughts.
5. **Menu Reachability & Setting Migration**: Existing users who rely on left-click opening the menu must not experience a silent, surprising behavior change.

## Decision

1. **Left-Click Toggles Quick Capture Popover**:
   - `show_menu_on_left_click(false)` disables the native left-click menu when configured for capture.
   - Left-click on `MouseButtonState::Up` toggles the capture window anchored under the icon.
   - Right-click natively opens the full tray menu on all platforms.

2. **Work Area Clamping & Multi-Monitor Math (`tray_position.rs`)**:
   - Implemented manual pure-Rust positioning without external plugins.
   - Queries `available_monitors()`, determines the monitor containing the tray icon's physical coordinates, and retrieves its physical `work_area` and `scale_factor`.
   - Centers popover horizontally under the icon: `desired_x = icon_center - (win_w / 2)`.
   - Clamps horizontal position between `work_area.x + 8px` and `work_area.x + work_area.width - win_w - 8px`.
   - Checks vertical midpoint: if icon is in upper half (macOS menu bar, top taskbars), positions below icon; if in lower half (Windows bottom taskbar), positions above icon.

3. **Blur/Toggle Race Elimination via Timestamp Debounce**:
   - `CaptureState` maintains `last_blur_time: Arc<AtomicU64>`.
   - On `WindowEvent::Focused(false)`, the capture window records `now_ms` and hides.
   - When the tray click handler runs, if `now_ms - last_blur_time < 350ms`, it treats the click as part of the dismiss action and does not reopen the window. Clicks beyond 350ms toggle open cleanly.

4. **In-Memory Draft Preservation**:
   - Unsaved typed text in `<QuickCapture />` is preserved in memory across blur, Escape, and mode switches.
   - Draft text is only cleared upon successful save (`handleSave`) or process termination (app quit). No disk persistence of partial drafts.

5. **Configurable Left-Click Action with Non-Destructive Migration**:
   - Added `"trayLeftClickAction"` (`"capture"` | `"menu"`) to `davinci-tray-settings.json`.
   - New installs default to `"capture"` ("Open quick capture").
   - Existing configs missing the key default to `"menu"` ("Open menu") to prevent silent changes to user workflows.
   - Live runtime updates via `tray.set_show_menu_on_left_click(action == "menu")` with zero restart.
   - On unsupported platforms (e.g. Linux), `TrayClickSettingsRow` conditionally renders `null` so no non-functional settings are displayed.

## Consequences

- Quick capture is accessible with a single click anywhere on macOS and Windows.
- Full menu reachability remains via right-click, keyboard shortcuts, and app menus.
- Zero capability expansions: `capabilities/capture.json` remains completely unmodified.
- Pure Rust positioning adds zero external crates or bundle bloat.
