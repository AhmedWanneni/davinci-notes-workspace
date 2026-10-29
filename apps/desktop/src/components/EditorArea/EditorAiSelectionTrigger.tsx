import { createPortal } from "react-dom";
import { Sparkle } from "@phosphor-icons/react";
import type { SelectionBounds } from "./EditorAiSelectionTypes";
import styles from "./EditorAiSelection.module.scss";

export interface EditorAiSelectionTriggerProps {
  bounds: SelectionBounds | null;
  onOpen: () => void;
}

export function EditorAiSelectionTrigger({
  bounds,
  onOpen,
}: EditorAiSelectionTriggerProps) {
  if (!bounds || typeof document === "undefined") {
    return null;
  }

  const { rect } = bounds;
  // Position above the selection if space allows, otherwise below
  const buttonHeight = 28;
  const spacing = 6;
  const showAbove = rect.top - buttonHeight - spacing > 60;
  const top = showAbove
    ? rect.top - buttonHeight - spacing
    : rect.bottom + spacing;
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - 160));

  return createPortal(
    <button
      type="button"
      data-ai-selection-trigger="true"
      className={styles["editor-ai-selection__trigger"]}
      style={{ top: `${top}px`, left: `${left}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title="Ask AI to edit, amend, or explain (Cmd+K)"
      aria-label="Ask AI to edit or amend selected text"
    >
      <span className={styles["editor-ai-selection__trigger-icon"]}>
        <Sparkle size={13} weight="fill" />
      </span>
      <span>Ask AI</span>
      <span className={styles["editor-ai-selection__trigger-kbd"]}>⌘K</span>
    </button>,
    document.body,
  );
}
