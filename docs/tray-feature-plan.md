# Menu Bar / System Tray Feature Plan

Overview of the system tray implementation for DaVinci Notes.

## Status Summary

- **Phase 1: Static Menu Bar Icon** — Complete (macOS monochrome menu bar template icon with Show/Hide, New note, Quit).
- **Phase 2: Close to Tray & Unified Clean Quit** — Complete ("Keep running in menu bar" toggle, window close interception, clean quit synchronization across all exit paths).
- **Phase 3: Dynamic Menu** — Complete (Last 5 recent notes with folder collision disambiguation, Today's daily note, Open vault, 200ms debounced updates, 0 polling at rest).
- **Phase 4: Global Shortcut & Lazy Quick Capture** — Complete (`Control+Alt+N`, lazy isolated `capture.html` window, safe append-only note writing, vault root confinement).
- **Phase 4a: Save-Time External-Change Guard** — Complete (ADR-0170 superseding ADR-0161: pure append merges losslessly, conflict detection with banners and conflict copy preservation).
- **Phase 4b: Click-to-Capture Popover & Setting** — Complete (ADR-0172: Left-click toggles quick capture popover anchored under icon with work-area clamping, right-click opens menu, 350ms blur/click debounce race suppression, in-memory draft preservation, "Menu bar icon click" setting).
- **Phase 4c: Exact Popover Anchoring & Save-As Options** — Complete (ADR-0180: Pixel-perfect tray icon anchoring in physical pixels across 1x/2x displays, real window size querying, fallback chain, standalone note creation in `Quick Notes/`, optional Name and Folder fields, 20 unique same-second captures, pure append fallback, and 0 SQLite touches).
- **Phase 5: Quick Search in Capture Window** — Complete (ADR-0171: FTS5 BM25 search in capture window via scoped SQL permissions, WAL mode concurrency, native note jump).
- **Phase 6: Sync Status in Tray Menu** — Deferred (client daemon not yet active in desktop).
- **Phase 7: Settings Consolidation & Audit** — Next up.

## Phase 4c Details: Exact Popover Anchoring & Save-As Destination Options

### Goals & Implementation
1. **Pixel-Perfect Popover Anchoring**: Window top-center is aligned directly beneath the tray icon center in physical pixels, eliminating builder logical-point scaling doubling on Retina (2.0x) displays. Real OS window size is queried at placement time and re-calculated on every show event.
2. **Fallback Chain for Non-Click Opens**: Global shortcut and tray menu triggers resolve anchor rect via `tray.rect()`, last known click rect, and defined top-right monitor default.
3. **Dynamic Re-clamping**: If the popover grows or expands, `reclamp_capture_popover` re-clamps it strictly inside the monitor's work area.
4. **Standalone Note Creation**: By default, captures save as standalone notes in `Quick Notes/Quick note YYYY-MM-DD HH-mm-ss.md` (no colons) with unique numeric suffixes for same-second captures.
5. **Secondary Name & Folder Fields**: Optional note name and existing folder fields reachable via Tab without stealing focus. Strict Rust validation rejects path separators, `..`, null bytes, control chars, reserved names, and symlink escapes.
6. **Pure Append Fallback**: If an existing note is specified, falls back to lossless pure append compatible with Phase 4a save guard. Zero SQLite writes.
