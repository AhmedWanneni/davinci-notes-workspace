# ADR-0128: Vim mode indicator and escape hatch command

## Status
Accepted

## Context
Phase 4 of the Vim keybindings integration plan requires displaying a real-time glanceable Vim mode indicator (`NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`, `VISUAL BLOCK`, `REPLACE`) in the app's existing status bar, scoped strictly to when Vim keybindings are enabled. In addition, an escape hatch command is needed so users who accidentally land in modal editing can instantly restore standard non-modal text input without navigating settings.

## Decision
1. **Mode-Change Event Subscription**:
   - `@replit/codemirror-vim`'s `CodeMirror.on(getCM(view), "vim-mode-change", handler)` is attached inside `@app/editor`'s `attachVimModeListener` helper when `useVimMode` is enabled.
   - Mode objects `{ mode: string, subMode?: string }` format synchronously into uppercase status labels (`NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`, `VISUAL BLOCK`, `REPLACE`).
   - Clean listener unbind (`CodeMirror.off`) executes on view unmount or setting disable, preventing memory leaks.
2. **Status Bar Scoping**:
   - `StatusBar.tsx` reads `useVimMode` and `vimModeState` from `useWorkspaceStore`.
   - When `useVimMode` is `false` or `vimModeState` is `null`, the indicator badge is completely unmounted from the DOM.
3. **Stuck-User Escape Hatch Command**:
   - `CommandPalette.tsx` conditionally registers `"Disable Vim keybindings"` (`action:disable-vim`) when `useVimMode` is `true`.
   - Invoking the command executes `setUseVimMode(false)`, persisting the preference to SQLite and immediately restoring non-modal editing.

## Consequences
- Zero-latency, event-driven mode indicator update on every keypress without polling.
- Zero DOM clutter when Vim keybindings are disabled.
- Discoverable escape hatch in Command Palette for trapped users.
