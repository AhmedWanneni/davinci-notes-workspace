# Screen Review: AI Chat Composer & Mentions Menu

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/AgentView/AgentChatInput.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentChatInput.tsx), [`AgentMentionMenu.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentMentionMenu.tsx), [`AgentChatFooter.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentChatFooter.tsx)
- **Entry Points**: Pinned dock at the bottom of the AI Agent conversation view.
- **Purpose & Core User Job**: Prompts the AI agent, auto-expands textarea height based on typing, attaches `@` file/folder context references with fuzzy matching, switches models, and submits turns.
- **Current State Description**: Clean floating input container with auto-expanding textarea (48px–200px), mention autocomplete floating menu, context chips row, model picker button, and send/stop toggle button.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Send button transforms into Stop generation button during stream. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar AI chat composer dock. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Can cancel running generation; Esc dismisses `@` mention popup. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | `Enter` submits; `Shift+Enter` inserts newline; `@` triggers mentions. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Disabled state when no AI provider or API key is configured. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Typing `@` lists matching files and folders with fuzzy match highlighting. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | `@current` automatically attaches active note without searching. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean dock; removed extraneous chip clutter above composer. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Textarea preserves prompt text if submission encounters network refusal. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Placeholder "Ask agent anything... Type @ to reference notes or folders". |
| Laws of UX | Fitts's Law | **Pass** | Send/Stop button is prominent and anchored at bottom-right corner. |
| Laws of UX | Hick's Law | **Pass** | Simple input dock with minimal secondary controls. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with modern developer agents (Claude Code, Cursor). |
| Laws of UX | Miller's Law | **Pass** | Composer input chunked from footer model selector. |
| Laws of UX | Doherty Threshold | **Pass** | Instant textarea height recalculation on input event. |
| Laws of UX | Postel's Law | **Pass** | Enforces strict token budgets (24K tokens per note, 32K per folder outline). |
| Laws of UX | Von Restorff | **Pass** | Active send button highlighted with accent fill. |
| Gestalt Laws | Common Region | **Pass** | Single unified composer box. |
| Design System | Flat & Tokens | **Pass** | Uses `--color-bg-primary-alt` and `--color-border-subtle`; no drop shadows. |
| A11y & Perf | Keyboard Navigation | **Pass** | `ArrowUp`/`ArrowDown`/`Tab`/`Enter` keyboard navigation inside `@` mention menu. |

---

## 3. Issues & Recommended Fixes

### COMP-01: Textarea Auto-Focus Lost on Conversation Switch
- **Severity**: Low
- **Rule Violated**: H7 Flexibility & Efficiency
- **Evidence**: `AgentChatInput.tsx:88`: Switching conversations in the drawer closes drawer but does not restore focus to the composer textarea `[Observed]`
- **Impact**: User must click textarea again before typing their prompt in the newly opened conversation.
- **Suggested Fix**: Focus textarea in `onSelectConversation`.
- **Effort**: S (<10m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.agent-chat-dock` | Border + bg-primary-alt + radius-lg | Standard input card | Keep as-is (passes box audit) |

---

## 5. What Works Well
- `@` mention system (`useAgentMention.ts` & `AgentMentionMenu.tsx`) seamlessly autocompletes note paths and binds them into `<context_attachments>` without cluttering prompt text.
- Token budgeting guards against context window overflow before submitting prompts.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Auto-focus textarea on conversation switch.
- **Larger Work**: None.
