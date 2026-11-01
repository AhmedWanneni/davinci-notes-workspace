# UX Review: Git Sidebar & Remote Setup Panel

## 1. Overview
The Git Sidebar integrates full source control management into Sophia Desktop, consisting of the `GitRemoteSetupPanel.tsx` (when unconfigured or setting up a remote repository) and `@app/git-manager` (`GitSidebarPanel.tsx`, `GitChangesSection.tsx`, `GitGraphSection.tsx`, `GitCommitBox.tsx`, `GitSyncToolbar.tsx`, `GitBranchSwitcher.tsx`, `GitDiffViewer.tsx`, and `GitConflictResolver.tsx`).
- **Entry points**: Git icon on the IconRail, Command Palette (`"Git: Open Source Control"`).
- **Current state**: Rich VS Code-style Git panel featuring branch switching, staged/unstaged changes, commit message composer with shortcuts, sync toolbar (push/pull), commit history lane graph, side-by-side diff viewer, and remote credential configuration.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear sync indicator (`GitSyncToolbar`), progress spinner when connecting remote or committing, change counter badges. |
| **H2 Match with real world** | Pass | Standard Git metaphors (staged, unstaged, branch, commit, push, pull, resolve conflicts). |
| **H3 User control and freedom** | Pass | Users can discard changes, unstage files, cancel conflict resolution, and switch branches cleanly. |
| **H4 Consistency and standards** | Pass | Closely matches industry-standard source control sidebars (VS Code / JetBrains). |
| **H5 Error prevention** | Pass | Commit button is disabled when commit message or staged changes are empty; PAT token validation occurs before saving. |
| **H6 Recognition over recall** | Pass | File status badges (`M`, `A`, `D`, `U`) and diff viewer make changed lines immediately recognizable. |
| **H7 Flexibility and efficiency** | Pass | `Cmd+Enter` shortcut in commit box immediately commits changes. |
| **H8 Aesthetic and minimalist design** | Partial | Heavy box-in-box nesting around changes list, commit box, branch switcher, and diff cards. |
| **H9 Error recovery** | Pass | Descriptive error messages for remote setup (`messages` map: `bad-token`, `repository-not-found`, `no-push-access`). |
| **H10 Help and documentation** | Pass | Contextual PAT generation helper links (`Create a token on github.com ↗`). |
| **Fitts's Law** | Pass | Sizable commit button and clear row click targets for changes. |
| **Hick's Law** | Pass | Actions are scoped logically into Changes, Commit, and Graph sections. |
| **Jakob's Law** | Pass | Follows established source control sidebar conventions. |
| **Miller / Chunking** | Pass | Divides Git flow into logical chunks: Staged / Changes / Commit / Sync. |
| **Doherty Threshold** | Pass | Git porcelain queries and commit operations execute quickly via local Rust commands. |
| **Postel's Law** | Pass | Trims and handles varied git remote URLs and optional usernames. |
| **Von Restorff** | Pass | Primary Commit button and sync alert status prominently draw attention. |
| **Proximity** | Pass | Staging buttons are adjacent to their target file rows. |
| **Similarity** | Pass | Standard row heights and badge colors across changed files. |
| **Common Region** | Partial | Multiple bordered containers (CommitBox card, Changes card, Remote panel card). |
| **Uniform Connectedness** | Pass | Selected changed file connects directly to diff preview. |
| **Design tokens & styling** | Partial | Uses CSS Modules (`GitRemoteSetupPanel.module.scss`, `GitSidebarPanel.module.scss`) alongside design system tokens. |
| **Accessibility (a11y)** | Pass | Form inputs in remote setup panel provide explicit `aria-label`s; commit textarea has clear label. |
| **Performance feel** | Pass | Virtualized changes list (`@tanstack/react-virtual`) handles vaults with hundreds of changed files smoothly. |

---

## 3. Issues

### GIT-01: Password masking hides PAT input with no visibility toggle
- **Severity**: Low
- **Rule violated**: H3 User control and freedom / H5 Error prevention
- **Evidence**: `apps/desktop/src/components/GitRemoteSetupPanel/GitRemoteSetupPanel.tsx:122` (`type="password"`) `[Code-Read Only]`
- **Why it hurts the user**: Users pasting personal access tokens (which often have trailing whitespaces or accidental omissions) cannot reveal the token to verify what was pasted.
- **Suggested fix**: Add an eye / eye-slash toggle button inside the PAT input field.
- **Effort**: S

### GIT-02: Over-boxed card borders around GitCommitBox and sync toolbar
- **Severity**: Medium
- **Rule violated**: Gestalt Common Region / H8 Aesthetic and minimalist design
- **Evidence**: `packages/git-manager/src/components/GitCommitBox.module.scss` and `GitSidebarPanel.module.scss` `[Code-Read Only]`
- **Why it hurts the user**: Multiple heavy rounded borders and nested card backgrounds in a narrow (240px–300px) sidebar create visual clutter and reduce horizontal text space for commit messages and file paths.
- **Suggested fix**: Use subtle hairline dividers (`border-bottom: 1px solid var(--color-border-subtle)`) without rounded card bounding boxes.
- **Effort**: M

### GIT-03: Commit message textarea lacks auto-grow height
- **Severity**: Low
- **Rule violated**: H8 Minimalist / H7 Flexibility
- **Evidence**: `packages/git-manager/src/components/GitCommitBox.tsx` `[Code-Read Only]`
- **Why it hurts the user**: Multiline commit messages (conventional commits with body paragraphs) require awkward vertical scrolling in a fixed 3-line textarea.
- **Suggested fix**: Allow textarea to automatically expand up to 6 lines or use standard flex resizing.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.git-remote-panel` | Card background + border | Encloses form fields in an extra bounding box | Flat layout with generous vertical spacing and section header |
| `.git-commit-box` | Bordered card with radius | Heavy box floating in the sidebar | Simple top border divider above action buttons |
| `.git-changes-section` | Bordered card section | Extra container around virtualized list | Clean edge-to-edge list separated by hairline headers |

---

## 5. What Works Well
- Comprehensive Git workflow in a lightweight local package (`@app/git-manager`).
- Smart provider detection (`detectGitRemoteProvider`) with direct links to generate scoped PATs on GitHub/GitLab.
- Secure token storage in OS Keychain (`desktopGitPatStore`).
- Virtualized file list for vaults with high churn.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add visibility toggle button to PAT password input in `GitRemoteSetupPanel.tsx` (≤30 min).
- **Quick Win**: Auto-grow commit message textarea on multi-line typing (≤30 min).
- **Larger Work**: Flatten card wrappers across `@app/git-manager` components into an editorial, hairline-divided sidebar layout.
