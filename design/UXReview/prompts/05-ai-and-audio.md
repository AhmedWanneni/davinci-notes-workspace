# TASK: Rule-based UX Review — Group 05: AI & Audio Intelligence

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to AI and audio (ADR-0132 to ADR-0151, ADR-0143, ADR-0147, ADR-0150). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 05: AI & Audio Intelligence** against the UX rubric.
For each screen/surface in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 05
1. **AI Agent Workspace** (`apps/desktop/src/components/AgentView/AgentView.tsx`)
   - Centered Claude-style conversation layout (`max-width: 48rem`), user bubbles vs assistant plain text flow, empty state suggestion chips, scroll-to-bottom floating button (`AgentScrollBottomBtn.tsx`).
2. **AI Chat Composer & Mentions Menu** (`apps/desktop/src/components/AgentView/AgentChatInput.tsx`, `AgentMentionMenu.tsx`, `AgentChatFooter.tsx`)
   - Auto-growing prompt textarea (48px–200px), `@` file/folder autocomplete popup, attached context chips, model selector, clear history button.
3. **AI Tool Cards & Diff Viewer** (`apps/desktop/src/components/AgentView/AgentToolCard.tsx`, `AgentDiffViewer.tsx`, `AgentCodeBlock.tsx`, `AgentReasoningBlock.tsx`)
   - Collapsible tool execution status rows (Search, Edit, Bash), streaming spinner, success/error badges, interactive "View diff" modal, copyable code blocks with language labels, collapsible thinking accordion.
4. **Ask Your Vault Panel** (`apps/desktop/src/ai/AskYourVaultPanel.tsx`)
   - Right-sidebar RAG Q&A interface: Question input, vector similarity search status, grounded response with citation pill links jumping to note line numbers.
5. **AI Listening & Meeting Recorder** (`apps/desktop/src/components/ListeningView/ListeningView.tsx`)
   - Audio recording workspace: microphone source selector, live audio waveform visualizer, pause/resume/stop controls, real-time transcription feed with speaker diarization, auto-summary generation, "Create Meeting Note" action.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Hit targets for message action toolbar (Copy, Edit, Regenerate), stop generation button, and mention chips.
- **Hick's Law**: Clean composer without visual baggage; simple model switcher.
- **Jakob's Law**: Claude/ChatGPT conversation layout standards; familiar `@` mention triggers from Slack and modern coding agents.
- **Miller's Law & Chunking**: Tool calls chunked into collapsible rows; thinking blocks separate from final answer.
- **Doherty Threshold**: Real-time token streaming with requestAnimationFrame batching; immediate microphone recording indicator.
- **Postel's Law**: Permissive handling of raw markdown in AI responses, streaming unclosed tags, and network retries.
- **Von Restorff / Serial Position**: Clear distinction of code blocks and file diff modifications.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Assistant turns must flow as clean prose without unnecessary card borders or double nesting.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per component: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Zero re-renders on turns 1..(N-1) during streaming; virtualization on 20+ messages (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`apps/desktop/src/components/AgentView/AgentView.stories.tsx`, `AgentMentionMenu.stories.tsx`, `AgentCliStatusCard.stories.tsx`, `AskYourVaultPanel.stories.tsx`).
- **Keyboard-only pass**: Submit prompt with `Enter`, newline with `Shift+Enter`, mention selection via arrow keys, Esc to dismiss mention menu.
- **State matrix**: Empty chat state, active streaming generation, tool execution with error, long conversation (30+ turns), narrow window layout.
- Measure DOM nesting depth of messages, code blocks, and composer dock.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/05-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `AI-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/05-agent-workspace.md`
- Create `design/UXReview/screens/05-chat-composer-mentions.md`
- Create `design/UXReview/screens/05-tool-cards-and-diffs.md`
- Create `design/UXReview/screens/05-ask-your-vault.md`
- Create `design/UXReview/screens/05-listening-recorder.md`
- Commit: `docs(ux-review): group-05-ai-and-audio`
