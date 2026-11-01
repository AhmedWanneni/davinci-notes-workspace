# Screen Review: Vault Welcome / Onboarding

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/VaultWelcomeView/VaultWelcomeView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/VaultWelcomeView/VaultWelcomeView.tsx), [`RecentVaultsCard.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/VaultWelcomeView/RecentVaultsCard.tsx), [`_vault-welcome.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/components/_vault-welcome.scss)
- **Entry Points**: First launch before any vault is created, or when clicking "Close vault" in the IconRail.
- **Purpose & Core User Job**: Onboarding portal allowing users to Open an existing folder, Create a new vault, Open a sample demo vault, or pick from Recent Vaults.
- **Current State Description**: Centered hero layout with brand logo, title, multiple action cards (`.vault-welcome__card`), and a recent vaults panel.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Loading spinner & error banners present when opening vaults. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Plain folder / vault metaphors. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Clear actions to cancel or choose different folders. |
| Nielsen Heuristics | H4 Consistency and standards | **Fail** | Icons use `weight="duotone"` while rest of app uses `weight="regular"`. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Error alert with "Try Again" and "Choose Another Folder" buttons. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Recent vaults list displays full path and last opened status. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click access to sample demo vault for immediate testing. |
| Nielsen Heuristics | H8 Minimalist design | **Fail** | Multi-layered nested card boxes for simple button actions. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Clear error messages on unreadable directories or locked SQLite index. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Subtitle explains local-first knowledge base concept. |
| Laws of UX | Fitts's Law | **Fail** | The entire card is not clickable; only the small button nested inside the card triggers action. |
| Laws of UX | Hick's Law | **Pass** | 3 clear choices (Open Existing, Create New, Explore Demo). |
| Laws of UX | Jakob's Law | **Partial** | Obsidian welcome window uses full-card click targets rather than isolated sub-buttons. |
| Laws of UX | Miller's Law | **Pass** | Chunked into Action cards and Recent vaults. |
| Laws of UX | Doherty Threshold | **Pass** | Instant modal display; loading indicator on vault indexing. |
| Laws of UX | Postel's Law | **Pass** | Gracefully handles missing directories or removed recent vaults. |
| Laws of UX | Von Restorff | **Pass** | "Open Folder" has primary button prominence. |
| Gestalt Laws | Common Region (Box Audit) | **Fail** | Over-boxed: `.vault-welcome__card` wrapper carries border, radius, background, and separate inner button box. |
| Design System | Phosphor Regular Icons | **Fail** | Lines 91, 110, 130 use `weight="duotone"`, violating strict regular icon rule. |
| A11y & Perf | Keyboard & Focus Order | **Partial** | Tabbing enters the sub-button; card itself lacks focus indicator. |

---

## 3. Issues & Recommended Fixes

### WEL-01: Phosphor Duotone Icon Violation
- **Severity**: Medium
- **Rule Violated**: Project Design Rules (Iconography Standard)
- **Evidence**: `VaultWelcomeView.tsx:91, 110, 130`: `<FolderOpen size={22} weight="duotone" />`, `<PlusCircle size={22} weight="duotone" />`, `<CloudArrowDown size={22} weight="duotone" />` `[Observed]`
- **Impact**: Violates strict standing project rule: "Phosphor regular icons only (except active filled states)". Duotone icons look foreign and inconsistent with the rest of the application.
- **Suggested Fix**: Replace `weight="duotone"` with `weight="regular"` across all welcome view icons.
- **Effort**: S (<10m)

### WEL-02: Non-Clickable Card Containers (Fitts's Law Violation)
- **Severity**: High
- **Rule Violated**: Fitts's Law + Jakob's Law + Gestalt Common Region
- **Evidence**: `VaultWelcomeView.tsx:89-106`: The outer `.vault-welcome__card` has a hover state and full card styling, but clicking the card body or text does nothing; the user is forced to hit the smaller `<Button>` on the right `[Observed]`
- **Impact**: Frustrating dead-click zone. Users instinctively click anywhere on the card tile to open or create a vault.
- **Suggested Fix**: Make the entire `.vault-welcome__card` a clickable `<button>` or trigger `onClick` from the container, with keyboard focus ring on the whole row.
- **Effort**: S (<20m)

### WEL-03: Over-Boxing: Redundant Container Borders & Backgrounds
- **Severity**: Medium
- **Rule Violated**: Gestalt Common Region + H8 Minimalist Design
- **Evidence**: `.vault-welcome__cards` wraps multiple `.vault-welcome__card` elements with heavy borders, backgrounds, and sub-containers for body and actions `[Observed]`
- **Impact**: Visual heaviness; card boxes carry no extra information beyond an icon, two lines of text, and a trigger.
- **Suggested Fix**: Flatten cards to an elegant Swiss list separated by subtle hairline dividers (`--color-border-subtle`) and padding, or make them clean interactive row tiles.
- **Effort**: M (1h)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.vault-welcome__card` | `border`, `border-radius: var(--border-radius-lg)`, `background: var(--color-bg-primary-alt)` | False grouping and dead click area | Interactive button row tile with `border: var(--border-width-thin) solid var(--color-border-subtle)` and hover background |
| `.vault-welcome__card-action` | Separate right-aligned wrapper div | Redundant layout wrapper | Direct flex layout alignment |

---

## 5. What Works Well
- Clear recovery actions when a vault path fails to open (Try Again / Choose Another Folder).
- Recent Vaults card (`RecentVaultsCard.tsx`) provides quick 1-click access with individual remove buttons.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Replace `weight="duotone"` with `weight="regular"` in `VaultWelcomeView.tsx:91, 110, 130`.
  - Extend click handler across the entire card tile.
- **Larger Work**:
  - Redesign cards into clean editorial rows following the Swiss typography baseline.
