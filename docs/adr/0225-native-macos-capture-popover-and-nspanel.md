# ADR-0225: Native macOS Quick Capture Popover and NSPanel Architecture

## Status

Accepted (supersedes window configuration, activation, and level aspects of ADR-0172)

## Context

In ADR-0172 (Phase 4b), left-clicking the tray icon was transitioned from opening a static menu to toggling an anchored Quick Capture popover directly under the tray icon.

While the popover succeeded in basic note capture, it failed to behave like a native macOS menu bar popover (such as Control Center, Spotlight, or third-party menu bar utilities):
1. **Inability to Overlay Full-Screen Applications**: When an application is in native macOS full-screen mode, triggering Quick Capture fails to display over the full-screen Space, causing macOS to either ignore the popover or force a transition away from the full-screen app.
2. **Space-Jumping When Main Window is Open**: If the user works on Space 2 and triggers Quick Capture while the main DaVinci Notes editor window is open on Space 1, macOS WindowServer animates the viewport across to Space 1.
3. **Raising Unrelated Windows**: Triggering Quick Capture raises the main note editor window in front of other background applications.
4. **Dock and Cmd+Tab Disruption**: In `capture.rs`, `make_window_topmost` called `set_activation_policy(tauri::ActivationPolicy::Regular)`. When the main window was hidden to tray (`keep_in_tray: true`, `ActivationPolicy::Accessory`), opening Quick Capture forced the Dock icon to reappear and remain in the Dock after popover dismissal.

### Root Causes
- `tao-0.35.3` sets `always_on_top` to `NSFloatingWindowLevel` (level 3), which sits below native menu bar popover levels (`NSStatusWindowLevel` 25).
- `tao-0.35.3`'s `set_visible_on_all_workspaces` only applies `NSWindowCollectionBehaviorCanJoinAllSpaces`. AppKit strictly requires `NSWindowCollectionBehaviorFullScreenAuxiliary` (`1 << 8`) to permit a window to overlay full-screen application Spaces.
- In AppKit, non-activating key window behavior (`NSWindowStyleMaskNonactivatingPanel`) is strictly reserved for `NSPanel` subclasses. A plain `NSWindow` cannot accept key focus without activating the owning `NSApplication` (`[NSApp activateIgnoringOtherApps:YES]`), which triggers window raising and Space jumping.

## Decision

### 1. Dock and Application Activation Policy Separation
- Quick Capture is a non-activating accessory popover and will **never** alter the application's activation policy (`set_activation_policy`).
- When the main editor window is open, DaVinci Notes remains `ActivationPolicy::Regular` (Dock icon visible, Cmd+Tab active) per ADR-0019.
- When the main editor window is closed to tray (`keep_in_tray: true`), DaVinci Notes remains `ActivationPolicy::Accessory` (Dock icon hidden) per ADR-0183 / Phase 2.
- In both states, Quick Capture displays and receives keyboard focus without activating `NSApplication`. It does not raise the main window, does not switch Spaces, and does not flash or alter the Dock icon.

### 2. Convert Capture Window to `NSPanel` (`tauri-nspanel`)
- Convert the macOS Quick Capture window into an `NSPanel` subclass using `tauri-nspanel = "2.1"` (v2.1.1, MIT OR Apache-2.0, MSRV 1.75).
- The dependency is gated strictly under `[target.'cfg(target_os = "macos")'.dependencies]`.
- Zero new native C libraries or heavy transitive dependencies are introduced: `objc2` 0.6.4, `objc2-app-kit` 0.3.2, and `objc2-foundation` 0.3.2 are **already present** in `Cargo.lock` from Tauri, tao, and wry. Compiled binary delta on macOS is under 35 KB (0 KB on Windows and Linux).

### 3. Window Level and Collection Behavior
- Quick Capture panel is configured with:
  - `can_become_key_window: true`
  - `is_floating_panel: true`
  - `StyleMask::empty().nonactivating_panel()`
  - `PanelLevel::Status` (level 25, matching `NSStatusWindowLevel`)
  - `CollectionBehavior::new().can_join_all_spaces().full_screen_auxiliary()`
- This allows the popover to appear immediately over any desktop Space and over native macOS full-screen applications without exiting fullscreen or animating a Space switch.
- `tauri-nspanel`'s `install_text_input_client_window_level` patches elevated `WKWebView` text input clients so OS Input Method Editor (IME) candidate conversion windows (for Japanese, Chinese, Arabic, and dead keys) render cleanly in front of the elevated panel.

### 4. Dismissal, Blur, and Debounce Lifecycle
- Re-instate hide-on-blur on the capture window (`WindowEvent::Focused(false)` invokes `window.hide()`).
- Retain the 350ms debounce in `CaptureState::last_blur_time` (ADR-0172) to eliminate the toggle race when clicking the tray icon while the popover is focused.
- In-memory draft text in `<QuickCapture />` React state is strictly preserved across blur, dismiss, and reopen, clearing only upon successful note save.

### 5. Cross-Platform Safety
- All `tauri-nspanel` and AppKit references are strictly scoped to macOS via `#[cfg(target_os = "macos")]`.
- Windows and Linux builds retain their standard `WebviewWindowBuilder` always-on-top implementation with zero dependency or behavioral changes.

## Consequences

- Quick Capture behaves indistinguishably from a native macOS status bar popover.
- Works seamlessly over native macOS full-screen applications without exiting fullscreen.
- No Space jumping when invoking capture while the main window is open on a different Space.
- Background application windows and the main DaVinci Notes editor window remain unraised.
- Preserves ADR-0019 and ADR-0183 Dock and Cmd+Tab contracts.
- Zero capability expansion: `capabilities/capture.json` remains unmodified.
- Windows and Linux builds remain 100% unaffected.
