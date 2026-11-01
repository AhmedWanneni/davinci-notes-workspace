# Screen Review: AI Agent Workspace

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/AgentView/AgentView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentView.tsx), [`AgentMessageList.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentMessageList.tsx), [`AgentView.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentView.scss)
- **Entry Points**: Pinned "AI Agent" sparkle icon in the IconRail or tab `davinci://agent`.
- **Purpose & Core User Job**: Autonomous conversational AI agent workspace that indexes, searches, reasons, reads, and modifies notes across the entire vault.
- **Current State Description**: Centered Claude-style conversation layout (`max-width: 48rem`), user message bubbles (right-aligned, subtle border), assistant plain text flow, sticky scroll sentinel button, and slide-out conversations history drawer.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Animated spinner while streaming, model badge, CLI agent status card. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar AI chat interface (Claude / ChatGPT / Cursor). |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Stop generation button (`abortExecution`), Edit user turn, Regenerate assistant turn. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard centered conversation stream with bottom dock. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Staged file modifications require explicit approval unless auto-apply is toggled. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Empty state starter chips with sample prompt templates. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Fast conversation switching via history drawer; keyboard shortcuts (`Enter` submit). |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean typography flow; assistant responses are completely unboxed prose. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Failed tool calls display error badge and allow retrying turn. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Sample prompt suggestions guide users on vault organization capabilities. |
| Laws of UX | Fitts's Law | **Pass** | Jump-to-latest button appears dynamically when scrolled up. |
| Laws of UX | Hick's Law | **Pass** | Clean layout free from extraneous toolbar buttons. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Claude.ai centered conversation layout. |
| Laws of UX | Miller's Law | **Pass** | Conversation turn chunking. |
| Laws of UX | Doherty Threshold | **Pass** | RAF token batching prevents dropped frames during high-throughput generation. |
| Laws of UX | Postel's Law | **Pass** | Streaming block lexer safely renders unclosed markdown and code blocks. |
| Laws of UX | Von Restorff | **Pass** | Code blocks and tool status cards visually distinguished from narrative text. |
| Gestalt Laws | Common Region | **Pass** | Assistant messages avoid artificial card borders (passes box audit). |
| Design System | Flat & Tokens | **Pass** | Token colors for user bubbles and subtle hairline dividers. |
| A11y & Perf | Virtualization & Frame Rate | **Pass** | TanStack virtualization activates for 20+ messages; `React.memo` stops re-rendering turns 1..(N-1). |

---

## 3. Issues & Recommended Fixes

### AGT-01: Missed Schedule Banner Pushdown
- **Severity**: Low
- **Rule Violated**: H1 Visibility + Layout Shift
- **Evidence**: `AgentView.tsx:138-148`: `AgentMissedBanner` pushes down message list dynamically when mounted `[Observed]`
- **Impact**: Slight layout shift upon opening agent view if background cron tasks were missed.
- **Suggested Fix**: Reserve a fixed banner container or render as an inline message card in the conversation feed.
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.agent-message--assistant` | Pure prose flow, 0px border, 0px bg | Perfect flat execution | Keep as-is (passes box audit) |
| `.agent-message--user` | `border-radius: var(--border-radius-md); background: var(--color-bg-secondary)` | Subtle bubble card | Keep as-is (acceptable user message framing) |

---

## 5. What Works Well
- `React.memo` with custom prop comparator (`areBubblePropsEqual`) guarantees that typing or streaming tokens in turn N never triggers re-rendering of previous turns.
- Floating "Jump to latest ↓" button appears smoothly when scrolling up and re-arms auto-stick on click.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Integrate missed scheduled tasks into feed rather than banner pushdown.
- **Larger Work**: None; AgentView architecture is exemplary.
