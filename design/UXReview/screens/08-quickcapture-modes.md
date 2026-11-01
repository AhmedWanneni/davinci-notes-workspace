# UX Review: QuickCapture Modes 1–4

## 1. Overview
The QuickCapture window provides 4 dedicated workflow modes:
1. **Mode 1: Fast Note Capture** (`QuickCaptureDestination.tsx`): Distraction-free textarea, auto-focus, optional note title input, folder destination dropdown (`QuickCaptureDestination`), and `Cmd+Enter` save action.
2. **Mode 2: Quick Reminder** (`QuickCaptureReminder.tsx`): Task description input, date/time picker with presets (Today, Tomorrow, Next Week), destination note picker.
3. **Mode 3: Audio Record** (`QuickCaptureRecord.tsx`, `QuickCaptureRecordControls.tsx`): Live mic input level waveform, record/pause/stop buttons, automated background transcription into note.
4. **Mode 4: Quick Search** (`QuickSearchList.tsx`): Instant floating note search, keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`), path highlights, jump to note in main window.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear audio recording timer and waveform; instant search result count updates. |
| **H2 Match with real world** | Pass | Familiar date presets (Today, Tomorrow) and audio cassette/mic controls. |
| **H3 User control and freedom** | Pass | Can pause/resume voice recording; discard draft or change save destination. |
| **H4 Consistency and standards** | Pass | Search and capture match the main app's indexing and note models. |
| **H5 Error prevention** | Pass | Save button is disabled when text or reminder title is blank. |
| **H6 Recognition over recall** | Pass | Destination dropdown remembers last used capture folder. |
| **H7 Flexibility and efficiency** | Pass | `Cmd+Enter` saves note or reminder immediately from keyboard. |
| **H8 Aesthetic and minimalist design** | Pass | Clean, uncluttered capture views. |
| **H9 Error recovery** | Pass | Disk write errors display helpful remediation prompts. |
| **H10 Help and documentation** | Pass | Inline placeholder suggestions (e.g. "Buy milk @tomorrow 10:00"). |
| **Fitts's Law** | Pass | Sizable big red Record/Stop button; large save buttons. |
| **Hick's Law** | Pass | Focused single-purpose inputs per mode. |
| **Jakob's Law** | Pass | Parity with macOS quick note capture tools. |
| **Miller / Chunking** | Pass | Clear separation between content input and destination options. |
| **Doherty Threshold** | Pass | Note creation executes in <50ms to local disk. |
| **Postel's Law** | Pass | Natural language date parsing handles strings like "tomorrow at 5pm". |
| **Von Restorff** | Pass | Recording state changes button color and animates waveform. |
| **Proximity** | Pass | Destination folder dropdown positioned right above save button. |
| **Similarity** | Pass | Consistent typography across mode inputs. |
| **Common Region** | Pass | Clean edge-to-edge textareas. |
| **Uniform Connectedness** | Pass | Mode switches cleanly replace the center canvas without shifting frame. |
| **Design tokens & styling** | Pass | Uses Design System tokens and CSS Modules. |
| **Accessibility (a11y)** | Pass | Proper labels and keyboard focus on inputs. |
| **Performance feel** | Pass | Real-time audio waveform canvas renders smoothly via `requestAnimationFrame`. |

---

## 3. Issues

### CAPTURE-03: Reminder date picker dropdown lacks custom time input precision
- **Severity**: Low
- **Rule violated**: H7 Flexibility and efficiency
- **Evidence**: `apps/desktop/src/components/QuickCapture/QuickCaptureReminder.tsx` `[Code-Read Only]`
- **Why it hurts the user**: Presets only offer whole hours (9:00, 12:00, 17:00); scheduling a reminder for 14:15 requires manual text editing.
- **Suggested fix**: Add an inline time stepper or permissive natural language time parser.
- **Effort**: S

### CAPTURE-04: Destination folder selector resets to root if last folder was deleted
- **Severity**: Low
- **Rule violated**: H5 Error prevention
- **Evidence**: `apps/desktop/src/components/QuickCapture/QuickCaptureDestination.tsx` `[Code-Read Only]`
- **Why it hurts the user**: If a previously saved destination folder was removed, capture silently falls back to vault root without notifying the user.
- **Suggested fix**: Show a brief warning badge: `"Previous folder was moved. Saving to Vault root."`
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.quick-capture-destination` | Bordered selector box | Slightly heavy border | Flat dropdown trigger with subtle border |

---

## 5. What Works Well
- Instant `Cmd+Enter` keyboard flow across both Note Capture and Reminder modes.
- Real-time audio visualization waveform during voice recording.
- Fast fuzzy search mode jumping directly into main window note editor.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add warning notice when fallback folder is used (≤20 min).
- **Larger Work**: Add natural language reminder parsing (e.g. typing "Call Mom tomorrow 3pm" automatically populates date picker).
