---
name: create-dialog
description: Create or refactor a popup, modal, menu, or dialog in the desktop app following the canonical SettingsDialog / EditorMenuBarDropdown standard and the "Less Boxes Always" principle (colors, soft shadow, 13px font, 7px 14px padding, hairline dividers, no nested boxed cards).
---

# Create Dialog & Popup — Agent Skill

This skill guides the AI assistant in designing, creating, or refactoring modals, popups, and dropdown menus in DaVinci Notes / Sophia to match the reference design: clean typography, soft floating shadow, refined padding, and the **"Less Boxes Always"** principle.

---

## 1. When to Use This Skill

Activate whenever you are asked to:
- Create a new modal, popup, popover, or dialog (e.g. browser picker, export modal, insert menu, settings panel).
- Refactor or modernize an existing popup/dialog to match the app's design language.
- Clean up boxy layouts (replace nested cards/boxes with clean rows and hairline dividers).

---

## 2. The "Less Boxes Always" Design Rules

1. **Colors**:
   - Background: `var(--color-bg-primary)`
   - Hover state: `var(--color-bg-hover)` (subtle transparent tint)
   - Dividers: hairline `1px` with `var(--color-border-subtle)`
   - Text: `var(--color-text-normal)` (body), `var(--color-text-muted)` (shortcuts, secondary metadata, chevrons)
2. **Shadow & Perimeter**:
   - Soft elevated floating shadow: `box-shadow: 0 4px 20px rgb(0 0 0 / 10%);`
   - Perimeter border: `border: 1px solid var(--color-border-subtle);`
   - Border radius: `10px` (or `8px`)
3. **Fonts & Typography**:
   - Family: `var(--font-ui)`
   - Item labels: `font-size: 13px; font-weight: 400;`
   - Shortcuts / metadata: `font-size: 11px; color: var(--color-text-muted); letter-spacing: 0.02em;`
   - Dialog title / headers: `font-size: 13px; font-weight: 600;`
4. **Padding & Spacing**:
   - Container padding: `padding: 6px 0;` (or `padding: 6px 8px;`)
   - Item row padding: `padding: 7px 14px;` (or `8px 12px;`)
   - Icon-to-text gap: `gap: 10px;`
   - Icon size: `16px` to `18px`, optical center alignment
5. **No Nested Boxes**:
   - Avoid creating multiple bordered boxes, card grids, or dashed rectangles inside a popup.
   - Present options as a clean vertical list of rows with icons, text, and trailing metadata/chevrons (`CaretRight`).
   - Group sections using a single hairline divider (`height: 1px; background-color: var(--color-border-subtle); margin: 6px 0;`).

---

## 3. Standard TSX Pattern

```tsx
import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CaretRight } from "@phosphor-icons/react";
import styles from "./MyCustomDialog.module.scss";

export interface DialogOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  hasSubmenu?: boolean;
}

export interface MyCustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: readonly DialogOption[];
  onSelect: (id: string) => void;
}

export function MyCustomDialog({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
}: MyCustomDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles["dialog-overlay"]} />
        <DialogPrimitive.Content
          className={styles["dialog-root"]}
          aria-label={title}
        >
          <div className={styles["window-header"]}>
            <div className={styles["traffic-lights"]}>
              <button
                type="button"
                className={`${styles["traffic-dot"]} ${styles["traffic-dot--close"]}`}
                onClick={onClose}
                aria-label="Close dialog"
              />
              <span className={`${styles["traffic-dot"]} ${styles["traffic-dot--minimize"]}`} />
              <span className={`${styles["traffic-dot"]} ${styles["traffic-dot--maximize"]}`} />
            </div>
            <div className={styles["window-title"]}>{title}</div>
            <div className={styles["header-spacer"]} />
          </div>

          <div className={styles["dialog-body"]}>
            <div className={styles["menu-list"]} role="group">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={styles["menu-item"]}
                  onClick={() => onSelect(opt.id)}
                >
                  <span className={styles["menu-item-icon"]}>{opt.icon}</span>
                  <span className={styles["menu-item-text"]}>{opt.label}</span>
                  {opt.shortcut && (
                    <span className={styles["menu-item-shortcut"]}>{opt.shortcut}</span>
                  )}
                  {opt.hasSubmenu && <CaretRight size={13} className={styles["menu-item-caret"]} />}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

---

## 4. Standard SCSS Module Pattern

```scss
.dialog-overlay {
  background-color: var(--color-bg-scrim);
  position: fixed;
  inset: 0;
  z-index: 1000;
  animation: overlay-show 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-root {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 480px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
  animation: content-show 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlay-show {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes content-show {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.window-header {
  height: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border-subtle);
  background-color: var(--color-bg-primary);
  user-select: none;
}

.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 60px;
}

.traffic-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;

  &--close {
    background-color: #ff5f56; // stylelint-disable-line color-no-hex
  }
  &--minimize {
    background-color: #ffbd2e; // stylelint-disable-line color-no-hex
  }
  &--maximize {
    background-color: #27c93f; // stylelint-disable-line color-no-hex
  }
}

.window-title {
  flex: 1;
  text-align: center;
  color: var(--color-text-normal);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-ui);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-spacer {
  width: 60px;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
}

.menu-list {
  display: flex;
  flex-direction: column;
  padding: 2px 0;
  margin: 0;
  list-style: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-normal);
  background: transparent;
  border: none;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }
}

.menu-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  color: var(--color-text-normal);
  flex-shrink: 0;
}

.menu-item-text {
  flex: 1;
  white-space: nowrap;
}

.menu-item-shortcut {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  margin-left: auto;
}

.menu-item-caret {
  color: var(--color-text-muted);
  margin-left: auto;
  flex-shrink: 0;
}

.menu-divider {
  height: 1px;
  background-color: var(--color-border-subtle);
  margin: 6px 0;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--color-border-subtle);
  background-color: var(--color-bg-primary);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 12px;
  background-color: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  color: var(--color-text-normal);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }

  &.is-primary {
    border-color: var(--color-accent);
    background-color: var(--color-accent);
    color: var(--color-bg-primary);
    font-weight: 600;
  }
}
```

---

## 5. Strict Checklist Before Merging
- [ ] Wrapped in `@radix-ui/react-dialog`?
- [ ] "Less boxes always": Unboxed flat list rows, NO nested boxed card grids or heavy container borders?
- [ ] Colors: `var(--color-bg-primary)`, `var(--color-bg-hover)` on hover, `var(--color-border-subtle)` for hairline dividers?
- [ ] Shadow: Soft elevated floating shadow `box-shadow: 0 4px 20px rgb(0 0 0 / 10%);`?
- [ ] Fonts & Padding: 13px font size, 400 weight, 7px 14px (or 8px 12px) padding, 10px icon gap?
- [ ] Header: 44px with macOS traffic lights (`#ff5f56`, `#ffbd2e`, `#27c93f`) and centered title?
- [ ] Colocated `.module.scss` and Storybook story created?
- [ ] File under 200 lines (hard cap 250)?
