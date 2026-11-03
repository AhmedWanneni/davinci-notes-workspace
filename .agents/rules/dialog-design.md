---
trigger: always_on
description: Mandatory design rules for any modal, dialog, or popup created or modified by an AI agent, strictly enforcing the visual standard of SettingsDialog and the "Less Boxes Always" design principle (colors, shadow, fonts, padding, hairline dividers).
---

## Dialog, Modal & Popup Design Standard (Mandatory for all AI agents)

All modals, popups, menus, and dialogs in this codebase MUST follow the canonical design system established in `SettingsDialog` and `EditorMenuBarDropdown` (as demonstrated in the reference design).

### 1. The "Less Boxes Always" Principle (Strict Non-Negotiable)
- **NO nested box cards**: Never wrap every individual choice or option inside heavy bordered boxes or card grids.
- **NO heavy container borders**: Avoid boxes inside boxes inside boxes.
- **Flat, elegant rows**: Present choices, actions, and options as clean flat list rows with subtle hover backgrounds (`var(--color-bg-hover)`), icon on the left (`16px-18px`), label in the middle, and subtle metadata or trailing chevron on the right (`CaretRight` or shortcut `⌘K`).
- **Hairline dividers**: Separate distinct sections using a single hairline divider (`height: 1px; background-color: var(--color-border-subtle); margin: 6px 0;`) instead of boxing each section.

### 2. Colors, Shadows, Fonts & Padding Specifications
- **Shadow**: Floating soft elevation: `box-shadow: 0 4px 20px rgb(0 0 0 / 10%);`.
- **Perimeter border**: Clean hairline border: `border: 1px solid var(--color-border-subtle);`.
- **Border radius**: `border-radius: 10px;` (or `8px` / `var(--border-radius-md)` / `var(--border-radius-lg)`).
- **Background**: `background-color: var(--color-bg-primary);`.
- **Container padding**: Compact padding: `padding: 6px 0;` or `padding: 6px 8px;`.
- **Row padding**: `padding: 7px 14px;` or `padding: 8px 12px;` with `gap: 10px;` between icon and label.
- **Typography**:
  - Menu item / row text: `font-size: 13px; font-weight: 400; color: var(--color-text-normal); font-family: var(--font-ui);`.
  - Row hover: `background-color: var(--color-bg-hover);` with smooth transition (`transition: background-color 0.12s ease;`).
  - Metadata / shortcuts / accessories: `font-size: 11px; color: var(--color-text-muted); margin-left: auto; letter-spacing: 0.02em;`.
  - Section headers: `font-size: 12px; font-weight: 600; color: var(--color-text-muted); padding: 6px 14px;`.

### 3. Window Header (for Dialogs & Modals)
Dialogs must include the native macOS window header affordance at the top:
- Height: `44px` with `border-bottom: 1px solid var(--color-border-subtle)`.
- Traffic lights: Close red `#ff5f56`, Minimize yellow `#ffbd2e`, Maximize green `#27c93f`.
- Window title: Centered, `font-size: 13px; font-weight: 600; color: var(--color-text-normal);`.
- Symmetrical `60px` spacer on the right.

### 4. Entrance Animations & Radix Primitives
- Wrapped with `@radix-ui/react-dialog` (`Root`, `Portal`, `Overlay`, `Content`).
- Overlay: `animation: overlay-show 150ms cubic-bezier(0.16, 1, 0.3, 1);`.
- Root: `animation: content-show 150ms cubic-bezier(0.16, 1, 0.3, 1);` (scale from `0.96` to `1`).
- Class naming: kebab-case ONLY (`.dialog-overlay`, `.dialog-root`, `.window-header`, `.menu-item`, `.menu-divider`).
- File limit: Colocate `.module.scss`, under 200 lines (hard cap 250).
