# Migration Plan: apps/desktop CSS Modules to CUBE CSS

Migrate `apps/desktop` from CSS Modules (`Component.module.scss` + `import styles`) to **CUBE CSS** (Composition, Utility, Block, Exception) with global SCSS, plain string / `cn()` classNames in TSX, BEM naming for component blocks, Radix data-attributes for exceptions, bracket notation grouping for multi-layer classes, and strict Stylelint enforcement.

---

## User Review Required

> [!IMPORTANT]
> - **Scope Isolation**: `packages/design-system` is completely untouched. This migration only restructures `apps/desktop`'s local styles.
> - **Zero Runtime Regressions**: Build-time SCSS/PostCSS only. No runtime CSS-in-JS libraries.
> - **Bundle Impact**: We will measure CSS and JS output sizes before and after migration to ensure no regression against the 28.54 KB raw / 8.05 KB gzip baseline.

---

## Proposed Folder & Architecture Structure

```
apps/desktop/src/
├── styles/
│   ├── base/
│   │   ├── _root.scss             # Shell root container (#root, html, body)
│   │   └── _debug-log.scss         # Desktop debug log pre/output styling
│   ├── layout/
│   │   ├── _app-shell.scss         # .app-shell, .app-shell__main
│   │   ├── _sidebar.scss           # .app-sidebar, .app-sidebar__*, .app-right-sidebar
│   │   ├── _tabs.scss              # .app-tabs, .app-tabs__*
│   │   └── _editor-area.scss       # .editor-area
│   ├── components/                 # Thin BEM Blocks for desktop-composed views
│   │   ├── _file-tree.scss         # .file-tree, .file-tree__*
│   │   ├── _backlinks-panel.scss   # .backlinks-panel, .backlinks-panel__*
│   │   ├── _command-palette.scss   # .command-palette, .command-palette__*
│   │   ├── _empty-state.scss       # .empty-state, .empty-state__*
│   │   ├── _graph-view.scss        # .graph-view, .graph-view__*
│   │   ├── _local-graph-panel.scss # .local-graph-panel, .local-graph-panel__*
│   │   ├── _settings-dialog.scss   # .settings-dialog, .settings-dialog__*
│   │   ├── _global-graph-dialog.scss # .global-graph-dialog, .global-graph-dialog__*
│   │   └── _vault-welcome.scss     # .vault-welcome, .vault-welcome__*
│   ├── utilities/                  # App-level single-purpose utility classes
│   │   ├── _layout.scss            # .u-flex-1, .u-overflow-hidden, .u-full-height, .u-full-width
│   │   └── _text.scss              # .u-truncate
│   ├── lib/                        # Third-party styling overrides
│   │   ├── _codemirror.scss        # CodeMirror editor layout overrides
│   │   └── _radix.scss             # Radix dialog portal and overlay positioning
│   ├── cn.ts                       # Lightweight (<15 lines, zero-dep) CUBE class combiner
│   └── _main.scss                  # Single global entry point (cascade: base → layout → components → utilities → lib)
```

---

## Proposed Changes

### 1. Tooling & Core Utilities

#### [NEW] [cn.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/cn.ts)
- Implement a type-safe, zero-dependency `cn(...inputs)` helper (<15 lines) supporting conditional strings and array inputs.

#### [NEW] [.stylelintrc.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/.stylelintrc.json)
- Add Stylelint configuration for `apps/desktop` extending `stylelint-config-standard-scss`.
- Enforce BEM pattern and kebab-case via `selector-class-pattern` (`^[a-z]([a-z0-9-]+)?(__[a-z0-9-]+)?(--[a-z0-9-]+)?$`) and disallow raw hex colors via `color-no-hex`.

#### [NEW] [_main.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/_main.scss)
- Cascade entry point importing `base`, `layout`, `components`, `utilities`, and `lib` in exact order.

#### [MODIFY] [main.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/main.tsx)
- Replace per-component styles with `import "./styles/_main.scss";`.

#### [DELETE] [scss-modules.d.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/scss-modules.d.ts)
- Remove CSS Modules type declaration since desktop uses global CUBE SCSS.

---

### 2. Base & Layout Migration

#### [NEW] [base/_root.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/base/_root.scss)
#### [NEW] [base/_debug-log.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/base/_debug-log.scss)
#### [NEW] [layout/_app-shell.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/layout/_app-shell.scss)
#### [NEW] [layout/_sidebar.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/layout/_sidebar.scss)
#### [NEW] [layout/_tabs.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/layout/_tabs.scss)
#### [NEW] [layout/_editor-area.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/layout/_editor-area.scss)
#### [NEW] [components/_vault-welcome.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_vault-welcome.scss)

#### [MODIFY] [App.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.tsx)
- Remove `import styles from "./App.module.scss"`.
- Use `className="app-shell"` and `className="app-shell__main"`.

#### [MODIFY] [VaultWelcomeView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/VaultWelcomeView/VaultWelcomeView.tsx)
- Use `.vault-welcome`, `.vault-welcome__content`, `.vault-welcome__actions`, and `.debug-log`.

#### [MODIFY] [AppSidebar.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/AppSidebar/AppSidebar.tsx)
- Use `.app-sidebar`, `.app-sidebar__header`, `.app-sidebar__title`, `.app-sidebar__actions`, `.app-sidebar__content`.

#### [MODIFY] [AppTabs.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/AppTabs/AppTabs.tsx)
- Use `.app-tabs`, `.app-tabs__tab` with `data-active={isActive || undefined}`, `.app-tabs__close`, `.app-tabs__dirty-dot`.

#### [MODIFY] [EditorArea.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EditorArea/EditorArea.tsx)
- Use `.editor-area`.

#### [MODIFY] [RightSidebar.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/RightSidebar/RightSidebar.tsx)
- Use `.app-right-sidebar`.

#### [DELETE] [App.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.module.scss)
#### [DELETE] [AppRightSidebar.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/AppRightSidebar.module.scss)

---

### 3. Block Components Migration (CUBE CSS + BEM + Radix Exceptions)

#### [NEW] [components/_file-tree.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_file-tree.scss)
#### [MODIFY] [FileTree.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/FileTree/FileTree.tsx)
- Use `cn()` with bracket grouping: `className="file-tree"`, `className="file-tree__virtual-inner"`, `className="file-tree__row"` with `data-active={isActive || undefined}`, `.file-tree__icon`, `.file-tree__caret`, `.file-tree__file-icon`, `.file-tree__title`, `.file-tree__dirty-dot`.
#### [DELETE] [FileTree.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/FileTree/FileTree.module.scss)

#### [NEW] [components/_empty-state.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_empty-state.scss)
#### [MODIFY] [EmptyState.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EmptyState/EmptyState.tsx)
- Use `.empty-state` with `data-size={size}`, `.empty-state__icon`, `.empty-state__content`, `.empty-state__action`.
#### [DELETE] [EmptyState.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EmptyState/EmptyState.module.scss)

#### [NEW] [components/_backlinks-panel.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_backlinks-panel.scss)
#### [MODIFY] [BacklinksPanel.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/BacklinksPanel/BacklinksPanel.tsx)
- Use `.backlinks-panel`, `.backlinks-panel__header`, `.backlinks-panel__title`, `.backlinks-panel__count`, `.backlinks-panel__content`, `.backlinks-panel__card`, `.backlinks-panel__source-title`, `.backlinks-panel__snippet`.
#### [DELETE] [BacklinksPanel.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/BacklinksPanel/BacklinksPanel.module.scss)

#### [NEW] [components/_command-palette.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_command-palette.scss)
#### [MODIFY] [CommandPalette.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.tsx)
- Use `.command-palette__overlay`, `.command-palette__dialog`, `.command-palette__input-wrapper`, `.command-palette__input`, `.command-palette__list`, `.command-palette__item` with `data-selected={isSelected || undefined}`, `.command-palette__icon`, `.command-palette__highlight`.
#### [DELETE] [CommandPalette.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.module.scss)

#### [NEW] [components/_settings-dialog.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_settings-dialog.scss)
#### [MODIFY] [SettingsDialog.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx)
- Use `.settings-dialog`, `.settings-dialog__container`, `.settings-dialog__section`, `.settings-dialog__row`, `.settings-dialog__info`, `.settings-dialog__control`, `.settings-dialog__select`.
#### [DELETE] [SettingsDialog.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.module.scss)

#### [NEW] [components/_graph-view.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_graph-view.scss)
#### [NEW] [components/_local-graph-panel.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_local-graph-panel.scss)
#### [NEW] [components/_global-graph-dialog.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/components/_global-graph-dialog.scss)
#### [MODIFY] [GraphView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GraphView/GraphView.tsx) & [GraphRenderer.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GraphView/GraphRenderer.tsx)
- Use `.graph-view`, `.graph-view__svg`, `.graph-view__edge`, `.graph-view__node-group`, `.graph-view__node` with `data-active={node.id === activeNodeId || undefined}`, `.graph-view__label`, `.graph-view__empty`, `.graph-view__controls`.
#### [MODIFY] [LocalGraphPanel.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/LocalGraphPanel/LocalGraphPanel.tsx)
- Use `.local-graph-panel`, `.local-graph-panel__header`, `.local-graph-panel__title`, `.local-graph-panel__content`, `.local-graph-panel__empty`.
#### [MODIFY] [GlobalGraphDialog.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GlobalGraphDialog/GlobalGraphDialog.tsx)
- Use `.global-graph-dialog`, `.global-graph-dialog__content`, `.global-graph-dialog__graph-wrapper`.
#### [DELETE] [GraphView.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GraphView/GraphView.module.scss)
#### [DELETE] [LocalGraphPanel.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/LocalGraphPanel/LocalGraphPanel.module.scss)
#### [DELETE] [GlobalGraphDialog.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GlobalGraphDialog/GlobalGraphDialog.module.scss)

---

### 4. Utilities & Lib Layers

#### [NEW] [utilities/_layout.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/utilities/_layout.scss)
#### [NEW] [utilities/_text.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/utilities/_text.scss)
#### [NEW] [lib/_codemirror.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/lib/_codemirror.scss)
#### [NEW] [lib/_radix.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/styles/lib/_radix.scss)

---

### 5. Documentation Updates

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Log completion of CSS Modules → CUBE CSS migration with bundle comparison figures.

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Record architectural decision for CUBE CSS in `apps/desktop` (thin blocks, global cascade, data-attribute exceptions, bracket notation).

---

## Verification Plan

### Automated Tests
1. **Stylelint BEM Rule Test**:
   - Deliberately inject a non-BEM selector (e.g. `.invalidCamelCase`) into `components/_file-tree.scss` and run `pnpm exec stylelint "apps/desktop/src/styles/**/*.scss"`. Confirm it catches and fails on the error.
   - Remove the violation and verify clean pass.
2. **ESLint & TypeScript Typecheck**:
   - `pnpm --filter @app/desktop lint`
   - `pnpm --filter @app/desktop typecheck`
3. **Unit & Benchmark Tests**:
   - `pnpm test` (all 24 desktop tests + design-system and indexer suites must pass).
4. **CSS Bundle Size Verification**:
   - `pnpm --filter @app/desktop build:web && node scripts/check-bundle-size.mjs`
   - Record exact before/after CSS bundle metrics:
     - Baseline Total CSS: 28.54 KB raw / 8.05 KB gzip
     - Verify no size regression.

### Manual Verification
- Verify that the app shell, sidebar navigation, virtualized file tree, tabs, editor area, right sidebar, backlinks snippets with highlights, command palette fuzzy search, graph view (local & global), settings modal, and empty states render pixel-for-pixel identically to before.
