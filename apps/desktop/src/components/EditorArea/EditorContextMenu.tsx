import { useRef, useEffect } from "react";
import { TextAlignLeft, Selection } from "@phosphor-icons/react";
import styles from "./EditorContextMenu.module.scss";

export interface EditorContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onFormatSelection: () => void;
  onFormatNote: () => void;
  onClose: () => void;
}

export function EditorContextMenu({
  x,
  y,
  hasSelection,
  onFormatSelection,
  onFormatNote,
  onClose,
}: EditorContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const clampedX =
    typeof window !== "undefined"
      ? Math.max(8, Math.min(x, window.innerWidth - 200))
      : x;
  const clampedY =
    typeof window !== "undefined"
      ? Math.max(8, Math.min(y, window.innerHeight - 150))
      : y;

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? "⌘⇧F" : "Ctrl+Shift+F";

  return (
    <div
      ref={menuRef}
      className={styles["editor-context-menu"]}
      style={{ left: clampedX, top: clampedY }}
      role="menu"
      aria-label="Editor context menu"
    >
      {hasSelection && (
        <button
          type="button"
          className={styles["editor-context-menu__item"]}
          role="menuitem"
          onClick={() => {
            onFormatSelection();
            onClose();
          }}
        >
          <span className={styles["editor-context-menu__icon"]}>
            <Selection size={16} />
          </span>
          <span className={styles["editor-context-menu__label"]}>
            Format selection
          </span>
        </button>
      )}
      <button
        type="button"
        className={styles["editor-context-menu__item"]}
        role="menuitem"
        onClick={() => {
          onFormatNote();
          onClose();
        }}
      >
        <span className={styles["editor-context-menu__icon"]}>
          <TextAlignLeft size={16} />
        </span>
        <span className={styles["editor-context-menu__label"]}>
          Format note
        </span>
        <span className={styles["editor-context-menu__shortcut"]}>
          {shortcutLabel}
        </span>
      </button>
    </div>
  );
}
