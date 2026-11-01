# Screen Review: Vault Switcher

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/VaultSwitcher/VaultSwitcher.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/VaultSwitcher/VaultSwitcher.tsx), [`VaultSwitcher.module.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/VaultSwitcher/VaultSwitcher.module.scss)
- **Entry Points**: Pinned at the bottom of the left sidebar, or via header dropdown in `AppSidebarHeader.tsx`.
- **Purpose & Core User Job**: Displays active vault name, switches between recent vaults, opens folder picker, or creates new vaults.
- **Current State Description**: Radix dropdown menu trigger showing active vault name and caret icon. When opened, lists recent vaults with paths, timestamps, remove buttons, and creation actions.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Displays currently active vault name prominently. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar workspace/project switcher pattern. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Individual "Remove from recent" (X) buttons on list items. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Uses Radix accessible dropdown primitives. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Removing from recent vaults does not delete files from disk. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Displays full folder paths for each recent vault. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click vault switching without reloading the entire application. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean dropdown menu list. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Gracefully handles deleted directories. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Menu item "Help" links to documentation. |
| Laws of UX | Fitts's Law | **Partial** | Remove button ("X") on recent vault row is small (16px). |
| Laws of UX | Hick's Law | **Pass** | Chunked into Recent Vaults vs Actions (New Vault, Open Folder). |
| Laws of UX | Jakob's Law | **Pass** | Parity with Obsidian vault switcher popover. |
| Laws of UX | Miller's Law | **Pass** | Separators divide recent list from actions. |
| Laws of UX | Doherty Threshold | **Pass** | Instant dropdown opening without async delay. |
| Laws of UX | Postel's Law | **Pass** | Fallbacks for missing vault names. |
| Laws of UX | Von Restorff | **Pass** | Currently active vault marked with checkmark. |
| Gestalt Laws | Proximity & Closure | **Pass** | Radix DropdownMenuContent cleanly grouped with shadow-less border. |
| Design System | Radix Primitives | **Pass** | Built using `@app/design-system` DropdownMenu primitives. |
| A11y & Perf | Keyboard Navigation | **Pass** | Full keyboard arrow navigation and Escape dismissal. |

---

## 3. Issues & Recommended Fixes

### VSW-01: Cramped "Remove Recent Vault" Click Target
- **Severity**: Low
- **Rule Violated**: Fitts's Law
- **Evidence**: `VaultSwitcherRecentItem.tsx:42`: Delete icon button is 16×16px with narrow padding `[Observed]`
- **Impact**: Users attempting to switch vaults may accidentally click the remove button or miss it entirely.
- **Suggested Fix**: Provide an expanded hit box (24×24px) with subtle hover highlight.
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.vault-switcher__dropdown` | Border + bg-primary | Standard Radix menu | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Radix dropdown primitive ensures flawless focus trap, arrow navigation, and click-away dismissal.
- Tooltip displays full filesystem path on trigger hover.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Enlarge recent vault remove button hit target.
- **Larger Work**: None.
