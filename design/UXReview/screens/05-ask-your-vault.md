# Screen Review: Ask Your Vault Panel

## 1. Overview
- **Component Path**: [`apps/desktop/src/ai/AskYourVaultPanel.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/ai/AskYourVaultPanel.tsx), [`AskYourVaultPanel.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/ai/AskYourVaultPanel.scss)
- **Entry Points**: IconRail "Ask Your Vault" chat icon or accordion section in the Right Sidebar.
- **Purpose & Core User Job**: RAG (Retrieval-Augmented Generation) Q&A across the vault: retrieves relevant note chunks via cosine similarity and generates a grounded response with source citations.
- **Current State Description**: Compact panel containing a question textarea, "Ask" button, transmission status, grounded answer paragraph, and source citation links.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | "Cloud AI active" badge and "Asking..." button state during query. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Question & Answer reference assistant. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | User can ask follow-up questions freely. |
| Nielsen Heuristics | H4 Consistency and standards | **Fail** | Enter key does not submit question (inserts newline only). |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Disabled "Ask" button when question input is blank. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Explicit source citations show exact note titles and line numbers. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Partial** | Lacks `Enter` keyboard submission; requires manual mouse click. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Unstyled `<ul><li>` list for source citations looks unfinished. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Displays explicit error message if vector query or API call fails. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Placeholder "Ask about your notes". |
| Laws of UX | Fitts's Law | **Pass** | Full-width button and large question textarea. |
| Laws of UX | Hick's Law | **Pass** | Simple single-purpose input. |
| Laws of UX | Jakob's Law | **Partial** | AI chat inputs universally map `Enter` to submit; here it requires mouse click. |
| Laws of UX | Miller's Law | **Pass** | Question → Answer → Citations chunking. |
| Laws of UX | Doherty Threshold | **Pass** | Answers stream within 1–2s over local/cloud embedding search. |
| Laws of UX | Postel's Law | **Pass** | Handles queries with special characters or questions with no matching chunks. |
| Laws of UX | Von Restorff | **Pass** | Source citations formatted with line numbers. |
| Gestalt Laws | Common Region | **Pass** | Self-contained panel in sidebar. |
| Design System | Flat & Tokens | **Fail** | Raw unstyled `<ul><li><button>` elements without design-system token classes. |
| A11y & Perf | Keyboard Accessibility | **Fail** | Cannot submit question using keyboard alone. |

---

## 3. Issues & Recommended Fixes

### ASK-01: Textarea Lacks `Enter` Key Submission Shortcut
- **Severity**: High
- **Rule Violated**: H7 Flexibility & Efficiency + Jakob's Law + Accessibility Standards
- **Evidence**: `AskYourVaultPanel.tsx:27-28`: `<textarea value={question} ... />` has no `onKeyDown` listener `[Observed]`
- **Impact**: In every modern AI assistant (ChatGPT, Claude, Sophia AgentView), pressing `Enter` submits the prompt. In AskYourVault, pressing `Enter` merely adds a blank line, forcing the user to reach for their mouse to click the "Ask" button.
- **Suggested Fix**: Add standard `onKeyDown` handler:
  ```tsx
  <textarea
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (question.trim() && !busy) void submit();
      }
    }}
  />
  ```
- **Effort**: S (<10m)

### ASK-02: Unstyled Citation List Elements
- **Severity**: Medium
- **Rule Violated**: Project Design Rules + H8 Minimalist Design
- **Evidence**: `AskYourVaultPanel.tsx:30-36`: Renders raw `<ul>{result.citations.map(...)}</ul>` with unstyled default browser bullet points `[Observed]`
- **Impact**: Looks raw and unpolished; clashes with the rest of the dark-first design system.
- **Suggested Fix**: Style citations as compact interactive token pills (`.ask-your-vault__citation`) with subtle border, note icon, and line number badge.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.ask-your-vault__answer` | Subtle text container | Natural answer flow | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Citation click-through (`onOpenCitation`) navigates directly to the originating note and scrolls immediately to the cited line number per ADR-0147.
- Adheres strictly to grounding rule: only cites chunks that were actually retrieved and sent to the LLM.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add `Enter` to submit in question textarea.
  - Style citations with design token classes.
- **Larger Work**: None.
