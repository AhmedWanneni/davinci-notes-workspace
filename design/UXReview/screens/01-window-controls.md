# Screen Review: Window Controls

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/WindowControls/WindowControls.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/WindowControls/WindowControls.tsx), [`_window-controls.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/components/_window-controls.scss)
- **Entry Points**: Top-left on macOS (native traffic lights with alignment spacer) or top-right on Windows/Linux (custom HTML buttons).
- **Purpose & Core User Job**: Enables standard desktop window manipulation (Close, Minimize, Maximize / Restore).
- **Current State Description**: Renders custom SVG buttons for Close (`X`), Minimize (`Minus`), and Maximize (`Square`) with hover color feedback.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Hover background changes on button hover. |
| Nielsen Heuristics | H2 Match with real world | **Fail** | On Windows/Linux, buttons are ordered Close, Minimize, Maximize instead of Minimize, Maximize, Close. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Standard window controls for minimizing and maximizing. |
| Nielsen Heuristics | H4 Consistency and standards | **Fail** | Reverses conventional Windows/Linux platform control ordering. |
| Nielsen Heuristics | H5 Error prevention | **Fail** | Close button is positioned on the inner left, causing accidental window exit when attempting to minimize. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Standard minus, square, and X iconography. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Standard OS double-click to toggle maximize supported via drag region. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean button geometry without unnecessary borders. |
| Nielsen Heuristics | H9 Recover from errors | **Fail** | Quitting via Close button has zero confirmation prompt if unsaved background tasks exist. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | N/A. |
| Laws of UX | Fitts's Law | **Fail** | Hit target is 24×24px (and 11×11px on macOS mock mode), well below 32px desktop minimum. |
| Laws of UX | Hick's Law | **Pass** | Standard 3 choices. |
| Laws of UX | Jakob's Law | **Fail** | Reverses standard Windows title bar interaction muscle memory. |
| Laws of UX | Miller's Law | **Pass** | 3-item chunk. |
| Laws of UX | Doherty Threshold | **Pass** | Instantaneous native window response via Tauri RPC. |
| Laws of UX | Postel's Law | **Pass** | N/A. |
| Laws of UX | Von Restorff | **Pass** | Danger red hover state on Close button. |
| Gestalt Laws | Uniform Connectedness | **Pass** | Grouped together in top chrome. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens for colors and transitions. |
| A11y & Perf | Keyboard & Targets | **Partial** | Accessible labels present (`aria-label`), but hit targets are cramped. |

---

## 3. Issues & Recommended Fixes

### WIN-01: Inverted Window Control Order on Windows / Linux (Severe Accident Risk)
- **Severity**: Blocker
- **Rule Violated**: H5 Error Prevention + H4 Consistency and Standards + Jakob's Law
- **Evidence**: `WindowControls.tsx:35-58`: Render sequence is Close button first, then Minimize, then Maximize `[Observed]`
- **Impact**: On Windows and Linux, every application places Minimize on the left, Maximize in the middle, and Close on the far right. Users attempting to minimize or maximize Sophia instinctively click the leftmost button, which immediately **terminates the entire application window**.
- **Suggested Fix**: Reorder DOM buttons to standard Windows/Linux sequence: Minimize → Maximize → Close:
  ```tsx
  // Before
  <button className="window-controls__button--close" onClick={handleClose}>...</button>
  <button onClick={handleMinimize}>...</button>
  <button onClick={handleMaximize}>...</button>

  // After
  <button className="window-controls__button" onClick={handleMinimize} aria-label="Minimize window">
    <Minus size={14} weight="bold" />
  </button>
  <button className="window-controls__button" onClick={handleMaximize} aria-label="Maximize window">
    <Square size={12} weight="regular" />
  </button>
  <button className="window-controls__button window-controls__button--close" onClick={handleClose} aria-label="Close window">
    <X size={14} weight="bold" />
  </button>
  ```
- **Effort**: S (<15m)

### WIN-02: Cramped Click Target (24px vs 32px Minimum)
- **Severity**: High
- **Rule Violated**: Fitts's Law
- **Evidence**: `_window-controls.scss:13-14`: `width: 24px; height: 24px;` `[Observed]`
- **Impact**: Tiny 24px square requires excessive cursor precision at the top edge of the screen; difficult to target quickly on high-DPI displays.
- **Suggested Fix**: Expand button bounds to `width: 36px; height: 28px;` or `height: 100%` of titlebar with centered icons, matching standard Windows titlebar button hitboxes.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.window-controls__button` | `background: var(--color-bg-primary-alt)` | Individual buttons have background boxes even when idle | `background: transparent;` with background tint on `:hover` only |

---

## 5. What Works Well
- macOS traffic lights correctly use native OS inset and drag regions per ADR-0156 without drawing conflicting web mock lights in production.
- Red danger hover tint on Close button provides clear destructive warning.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Swap DOM order of buttons in `WindowControls.tsx` (Minimize → Maximize → Close).
  - Enlarge click hitbox from 24px to 36×28px.
  - Set idle button background to `transparent`.
- **Larger Work**: None.
