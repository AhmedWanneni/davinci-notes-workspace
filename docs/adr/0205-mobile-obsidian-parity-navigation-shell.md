# ADR-0205: Mobile Obsidian-Parity Navigation Shell and Drawer Architecture

## Status
Accepted

## Context
The initial mobile implementation relied on Expo Router bottom tab navigation (`(tabs)/_layout.tsx`) with persistent bottom tabs.
While functional, this diverged from Obsidian's mobile interaction paradigm, which features:
1. Full-screen note reading and editing views without bottom tab bars.
2. A top header (`MobileHeader`) hosting sidebar toggle (`SidebarSimple`), note title with optional dropdown, reading view toggle, and more actions menu (`DotsThreeVertical`).
3. A slide-out navigation drawer (`NavigationDrawer`) containing leaf navigation pills (`LeafSelectorPill`: Files, Search, Tags) and a bottom vault switcher bar (`VaultSwitcherBar`).
4. A 5-action bottom quick-action bar (`QuickActionBar`: Edit, New Note, Quick Switcher, Tabs, More).
5. A grouped-card note actions bottom sheet (`NoteActionSheet`).

## Decision
1. Introduce canonical shell components in `apps/mobile/components/shell/`:
   - `MobileHeader`: 44pt top bar with Phosphor icons.
   - `NavigationDrawer`: Smooth animated left drawer overlaying the view with scrim backdrop and hardware back button dismissal.
   - `QuickActionBar`: 48pt bottom bar with 5 primary action targets.
   - `VaultSwitcherBar`: Vault title, note/folder counts, and circular Settings button.
   - `NoteActionSheet`: 3 grouped cards matching Screenshot 1.
   - `LeafSelectorPill`: Capsule pill switcher matching Screenshot 2.
2. Eliminate persistent bottom tab bars on note view and editor screens. Note viewing and editing take full screen height with safe area insets.

## Consequences
- The mobile UI achieves 1:1 visual and behavioral parity with the Obsidian mobile reference designs.
- Hardware back button on Android cleanly closes open sheets and navigation drawer prior to popping route history.
