# Screen Review: AI Listening & Meeting Recorder

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/ListeningView/ListeningView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ListeningView/ListeningView.tsx), [`ListeningHeader.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ListeningView/ListeningHeader.tsx), [`TranscriptFeed.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ListeningView/TranscriptFeed.tsx)
- **Entry Points**: Pinned "AI Listening" ear icon in the IconRail or tab `davinci://listening`.
- **Purpose & Core User Job**: Real-time audio recording and meeting intelligence: captures microphone/system audio, renders live waveform, streams speech-to-text transcript with speaker diarization, generates action items, and saves meeting notes directly to the vault.
- **Current State Description**: Full-window recording studio with header controls (Title, Record/Pause/Stop, elapsed timer, audio level meter), central live transcript feed, and side drawer for action items and suggested links.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Pulsing red recording dot, elapsed timer, live VU level meter. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Audio recording studio / meeting recorder metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Pause, resume, stop, and discard session controls. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard recording media transport controls (Record, Pause, Stop). |
| Nielsen Heuristics | H5 Error prevention | **Pass** | "Discard session" requires explicit confirmation. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Auto-detected action items displayed in dedicated sidebar. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | "Save as Note" creates markdown note with formatted meeting template. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean transcript stream; minimal audio chrome. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Session recovery preserves audio chunk buffer if app restarts mid-meeting. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty state explains microphone permissions and recording flow. |
| Laws of UX | Fitts's Law | **Pass** | Primary Record/Stop button is large and centered in header. |
| Laws of UX | Hick's Law | **Pass** | Simplified 3-button transport control. |
| Laws of UX | Jakob's Law | **Pass** | Matches Otter.ai and Granola live meeting notes UI. |
| Laws of UX | Miller's Law | **Pass** | Segmented into Header Transport, Transcript, and Action Items. |
| Laws of UX | Doherty Threshold | **Pass** | Real-time VU audio meter responds at 60fps via Web Audio API. |
| Laws of UX | Postel's Law | **Pass** | Robust crash recovery restores audio buffers. |
| Laws of UX | Von Restorff | **Pass** | Recording state highlighted with red indicator. |
| Gestalt Laws | Common Region | **Pass** | Cohesive 2-column layout (Transcript + Intelligence drawer). |
| Design System | CSS Modules Violation | **Fail** | `ListeningView.module.scss` violates desktop CUBE CSS architecture standard. |
| A11y & Perf | Performance & Battery | **Pass** | Audio processing runs in audio worklet thread without freezing UI. |

---

## 3. Issues & Recommended Fixes

### LIS-01: CSS Modules Usage in ListeningView
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `ListeningView.tsx:8`: Imports `ListeningView.module.scss` `[Observed]`
- **Impact**: Violates ADR-0038 CUBE CSS requirement for desktop application styling.
- **Suggested Fix**: Migrate styling to `apps/desktop/src/styles/components/_listening-view.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.listening-view__feed` | Pure transcript stream | Clean typography | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Audio level meter (micLevel & systemLevel) gives instant visual confirmation that audio hardware is capturing voice.
- Meeting recovery (`meetingRecovery.ts`) safeguards against data loss if battery dies or OS suspends.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate SCSS module to CUBE CSS.
- **Larger Work**: None.
