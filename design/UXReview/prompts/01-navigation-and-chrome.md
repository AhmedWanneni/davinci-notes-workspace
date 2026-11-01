# TASK: Rule-based UX Review — Group 01: Navigation & Shell Chrome

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to the UI shell (ADR-0038, ADR-0040, ADR-0156). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 01: Navigation & Shell Chrome** against the UX rubric.
For each screen in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 01
1. **App Shell Grid** (`apps/desktop/src/App.tsx`, `apps/desktop/src/styles/layout/_app-shell.scss`)
   - Reached on launch. Evaluates grid composition, sidebar toggle layouts, and root window framing.
2. **Window Controls** (`apps/desktop/src/components/WindowControls/WindowControls.tsx`)
   - macOS traffic lights inset spacer vs Windows/Linux undecorated minimize/maximize/close buttons. Drag regions.
3. **Icon Rail** (`apps/desktop/src/components/IconRail/IconRail.tsx`)
   - Left 40px vertical navigation rail: Files, Bookmarks, Git, AI Agent, Listening, Ask Vault, Search, Graph, Daily Notes, Calendar, Canvas, Reminders, Settings, Close Vault.
4. **App Tabs** (`apps/desktop/src/components/AppTabs/AppTabs.tsx`)
   - Top tab strip: tab selection, middle-click close, pin note, dirty state dot, overflow handling, window drag interaction.
5. **Status Bar & Sync Status Button** (`apps/desktop/src/components/StatusBar/StatusBar.tsx`, `apps/desktop/src/components/SyncStatusButton/SyncStatusButton.tsx`)
   - Bottom bar: vault name, active path, word/char counts, backlink/property counts, cloud AI indicator, sync status popover.
6. **Workspace Empty State** (`apps/desktop/src/components/EmptyState/EmptyState.tsx`)
   - Center workspace when all tabs are closed; keyboard shortcuts guide.
7. **Vault Welcome / Onboarding** (`apps/desktop/src/components/VaultWelcomeView/VaultWelcomeView.tsx`, `RecentVaultsCard.tsx`)
   - First-run view when no vault is open: Create Vault, Open Folder, Open Fixture, Recent Vaults list.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Target size & distance (minimum comfortable click target 32px desktop, 44px touch; hit targets of icon rail, tab close buttons, window controls).
- **Hick's Law**: Number of choices per menu / toolbar / navigation strip; avoiding icon rail clutter.
- **Jakob's Law**: Parity with Obsidian and VS Code expectations (tab reordering, drag region, shortcut conventions).
- **Miller's Law & Chunking**: Information grouped into digestible chunks (e.g. top rail vs bottom rail actions).
- **Doherty Threshold**: Response feels instant (<400ms); no tab switch lag or layout popping.
- **Postel's Law**: Input tolerance (handling rapid tab switching, middle click, double-click to maximize).
- **Von Restorff / Serial Position**: Active tab and primary actions stand out without visual noise.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Every unnecessary border or background creates a false group.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per screen: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons (except active filled states), design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Layout shifts (CLS), slow tab activation, behavior on window resize down to 640×480.

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and check Storybook stories (`apps/desktop/src/components/IconRail/IconRail.stories.tsx`, `AppTabs`, `StatusBar`, `VaultWelcomeView.stories.tsx`, `WindowControls.stories.tsx`).
- **Keyboard-only pass**: Tab navigation order across IconRail, Tabs, and Welcome view. Escape behavior. Shortcut testing (`Cmd+W`, `Cmd+P`, `Cmd+\`).
- **State matrix**: Test each screen in Empty, Loading, Populated, Error, Long Content (25+ open tabs), and Narrow Window (640×480).
- Measure wrapper nesting depth using DevTools or DOM script.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/01-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `CHROME-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/01-app-shell.md`
- Create `design/UXReview/screens/01-window-controls.md`
- Create `design/UXReview/screens/01-icon-rail.md`
- Create `design/UXReview/screens/01-app-tabs.md`
- Create `design/UXReview/screens/01-status-bar.md`
- Create `design/UXReview/screens/01-empty-state.md`
- Create `design/UXReview/screens/01-vault-welcome.md`
- Commit: `docs(ux-review): group-01-navigation-and-chrome`
