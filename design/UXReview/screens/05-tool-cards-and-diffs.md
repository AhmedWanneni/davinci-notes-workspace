# Screen Review: AI Tool Status Cards & Diff Viewer

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/AgentView/AgentToolCard.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentToolCard.tsx), [`AgentDiffViewer.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentDiffViewer.tsx), [`AgentCodeBlock.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentCodeBlock.tsx), [`AgentReasoningBlock.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AgentView/AgentReasoningBlock.tsx)
- **Entry Points**: Rendered in assistant turns whenever the AI agent executes tools (file reads, writes, searches, terminal commands) or returns code/thinking blocks.
- **Purpose & Core User Job**: Provides transparency into the agent's actions, tool execution status (running, success, error), inspectable inputs/outputs, code syntax highlighting with copy, and side-by-side file diff review before applying changes.
- **Current State Description**: Sleek collapsible accordion cards for tool executions with status icons, interactive "View diff" link, copyable code blocks with language labels, and collapsible thinking blocks.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Animated spinner while tool runs; green check on success; red warning on error. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar git diff and code terminal metaphors. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Accept / Reject buttons per staged change, or "Accept all". |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard unified diff coloring (green additions, red deletions). |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Code modifications are staged in memory; user can inspect diff before writing to disk. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Formatted action title (e.g. `Edit Note: Work/Project.md`). |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click clipboard copy on code blocks with 2-second checkmark feedback. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Collapses bulky terminal outputs into sleek status rows by default. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Reject button discards unwanted file modifications safely. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Tool execution errors include raw stderr output in collapsible view. |
| Laws of UX | Fitts's Law | **Pass** | "Accept" and "Reject" buttons have generous hit targets (>32px). |
| Laws of UX | Hick's Law | **Pass** | Simple binary choice per diff (Accept vs Reject). |
| Laws of UX | Jakob's Law | **Pass** | Matches Cursor / GitHub pull request diff interfaces. |
| Laws of UX | Miller's Law | **Pass** | File diffs chunked per modified file. |
| Laws of UX | Doherty Threshold | **Pass** | Real-time diff calculation via pure TS line diff engine. |
| Laws of UX | Postel's Law | **Pass** | Tolerates unexpected tool output formats without breaking message flow. |
| Laws of UX | Von Restorff | **Pass** | File diff viewer opens in prominent highlighted modal/overlay. |
| Gestalt Laws | Common Region | **Pass** | Clean card grouping for tools; automatically collapses on completion. |
| Design System | Flat & Tokens | **Pass** | Diff colors use tokens (`--color-text-success`, `--color-text-error`). |
| A11y & Perf | Performance & Memory | **Pass** | Memoized code blocks prevent re-highlighting during stream. |

---

## 3. Issues & Recommended Fixes

### TOOL-01: Diff Viewer Modal Lacks Sticky Accept/Reject Action Bar on Long Diffs
- **Severity**: Medium
- **Rule Violated**: Fitts's Law + H3 User Control
- **Evidence**: `AgentDiffViewer.tsx:75-110`: When reviewing a 500-line diff, the Accept/Reject buttons scroll off-screen with the header `[Observed]`
- **Impact**: User must scroll all the way back to the top or bottom to accept or reject the change after reviewing.
- **Suggested Fix**: Make the diff actions toolbar sticky at the bottom or top of the diff viewer frame (`position: sticky; bottom: 0;`).
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.agent-tool-card` | Thin border + subtle bg | Collapsible status row | Essential structural indicator; keep as-is |

---

## 5. What Works Well
- Auto-collapsing thinking blocks (`<think>`) show live animated spinner while stream is generating, then neatly tuck into "Thought process" on finish.
- Code blocks include clean language chrome and reliable 1-click clipboard copy.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Make diff viewer accept/reject buttons sticky during long diff scrolling.
- **Larger Work**: None.
