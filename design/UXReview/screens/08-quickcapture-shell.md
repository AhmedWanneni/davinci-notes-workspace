# UX Review: QuickCapture Window Shell

## 1. Overview
The QuickCapture Window Shell (`QuickCapture.tsx`, `QuickCaptureHeader.tsx`, `QuickCaptureFooter.tsx`, `QuickCaptureHints.tsx`) is a dedicated floating utility window anchored to the OS system tray menu bar icon.
- **Entry points**: Global system shortcut (`Cmd+Shift+N` on macOS / `Ctrl+Shift+N` on Windows/Linux) or clicking the Sophia tray icon.
- **Current state**: Compact window (780×520px) featuring a top mode switch bar (Capture, Reminder, Record, Search), character/result counters, close/quit buttons, an active mode content viewport, and a persistent keyboard shortcut footer.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Active mode clearly indicated; character limit counter with warning color approaching 10k chars. |
| **H2 Match with real world** | Partial | Uses a raw emoji `🎙️ Record` in the header tab instead of a Phosphor icon. |
| **H3 User control and freedom** | Pass | `Escape` key dismisses/hides window instantly without losing drafts; `Cmd+Q` quits cleanly. |
| **H4 Consistency and standards** | Partial | Uses CSS Modules with raw emojis rather than unified design system icon tokens. |
| **H5 Error prevention** | Pass | Retains unsaved capture drafts in local storage if accidentally dismissed. |
| **H6 Recognition over recall** | Pass | Footer persistently shows available shortcuts (`Esc to close`, `Cmd+Enter to save`). |
| **H7 Flexibility and efficiency** | Pass | Instant global invocation from anywhere in the OS without switching desktop focus. |
| **H8 Aesthetic and minimalist design** | Pass | Sleek floating HUD design; minimal padding and distraction-free layout. |
| **H9 Error recovery** | Pass | Inline error alerts for disk save or audio recording issues. |
| **H10 Help and documentation** | Pass | Keyboard hints footer provides complete operational instructions. |
| **Fitts's Law** | Pass | Large mode switch tabs and primary save action button. |
| **Hick's Law** | Pass | 4 focused capture modes (Note, Reminder, Voice, Search). |
| **Jakob's Law** | Pass | Parity with Raycast / Alfred / Drafts quick capture HUDs. |
| **Miller / Chunking** | Pass | Header (mode), Body (editor), and Footer (metadata/shortcuts) chunking. |
| **Doherty Threshold** | Pass | Tauri popover reclamp and window display completes in <100ms. |
| **Postel's Law** | Pass | Auto-generates timestamped note names if title is left empty. |
| **Von Restorff** | Pass | Save / Record primary action buttons highlighted with accent tokens. |
| **Proximity** | Pass | Character counter positioned right alongside close controls. |
| **Similarity** | Pass | Consistent tab heights across all 4 modes. |
| **Common Region** | Pass | Single floating HUD card container. |
| **Uniform Connectedness** | Pass | Active tab connects seamlessly to editor surface. |
| **Design tokens & styling** | Partial | Uses raw emoji (`🎙️`) in `QuickCaptureHeader.tsx:62`, violating the Phosphor regular icon rule. |
| **Accessibility (a11y)** | Pass | Header tabs use `role="tablist"` and `role="tab"` with `aria-selected`. |
| **Performance feel** | Pass | Extremely lightweight memory footprint; instant shortcut responsiveness. |

---

## 3. Issues

### CAPTURE-01: Raw emoji used in tab header violates design system icon rules
- **Severity**: Low
- **Rule violated**: Project Design Rules (Phosphor regular icons only) / H4 Consistency
- **Evidence**: `apps/desktop/src/components/QuickCapture/QuickCaptureHeader.tsx:62` (`🎙️ Record`) `[Observed]`
- **Why it hurts the user**: Breaks visual elegance and consistency with other Phosphor icons; renders unpredictably across different OS platforms.
- **Suggested fix**: Replace `🎙️ Record` with `<Microphone size={16} /> Record` using `@phosphor-icons/react`.
- **Effort**: S

### CAPTURE-02: Missing window drag handle on frameless popover
- **Severity**: Low
- **Rule violated**: H3 User control and freedom
- **Evidence**: `apps/desktop/src/components/QuickCapture/QuickCapture.module.scss` `[Code-Read Only]`
- **Why it hurts the user**: Users with multiple monitors or custom screen setups cannot drag the floating window if it obstructs reference materials.
- **Suggested fix**: Add `data-tauri-drag-region` to the header bar background.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.quick-capture-header` | Border-bottom container | Appropriate HUD boundary | Keep subtle hairline border |
| `.quick-capture-footer` | Border-top container | Appropriate HUD boundary | Keep subtle hairline border |

---

## 5. What Works Well
- Super-fast global invocation (`Cmd+Shift+N`) from any app on the system.
- Draft persistence so accidental dismissals never lose thoughts.
- Automatic theme inheritance matching the main app vault (`useCaptureTheme`).

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Replace `🎙️` emoji with Phosphor `<Microphone />` icon (≤10 min).
- **Quick Win**: Add `data-tauri-drag-region` to header for window repositioning (≤15 min).
- **Larger Work**: Add global hotkeys to switch directly into specific modes (`Cmd+Shift+R` for reminder, `Cmd+Shift+V` for voice).
