# ADR-0228: Dedicated AI Listening Workspace Page (`davinci://listening`)

## Status

Accepted

## Context

A meeting recording experience requires continuous visibility into:
1. Recording time, live volume indicators, and pause/resume/stop controls.
2. The real-time streaming transcript of the discussion.
3. The live meeting note being drafted by the AI assistant.
4. Vault context and `[[wikilink]]` suggestions.
5. In-meeting conversational Q&A ("What did we decide about X in last week's notes?").

A small modal dialog or sidebar panel cannot comfortably host this multi-faceted workflow without severe crowding.

## Decision

1. **Dedicated Workspace Leaf**:
   - Introduce `davinci://listening` as a full tab leaf inside `AppTabs.tsx`, following the Bookmarks (`davinci://bookmarks`), Reminders (`davinci://reminders`), and Agent (`davinci://agent`) navigation patterns.
   - Accessible via the primary navigation Icon Rail (`IconRail.tsx`) using an Ear/Waveform icon, from the Command Palette, and from calendar notifications.

2. **Split-View Responsive Workspace**:
   - Left pane (45%): Live virtualized transcript stream with audio level meter and speaker indications.
   - Right pane (55%): Live markdown meeting note preview, suggested vault links drawer, and conversational Q&A input.

3. **Persistent Recording Indicator**:
   - While recording is active, a red pulsing status dot `[● REC mm:ss]` is rendered in the global app header and the macOS/Windows tray menu, ensuring the user is always aware audio capture is live.

4. **Zero Startup Cost**:
   - The entire `ListeningView` component tree is dynamically imported via `React.lazy()`. It incurs 0 KB initial bundle cost and 0ms startup penalty.

## Consequences

- Full Obsidian-native workspace experience for meeting capture and review.
- Clean separation between reading past notes and participating in live meetings.
- Conforms to all design system rules (borders not shadows, dark-first, CUBE CSS).
