import { useState, useRef, useEffect } from "react";
import type { EditorView } from "@codemirror/view";
import { EditorMenuBarDropdown } from "./EditorMenuBarDropdown";
import styles from "./EditorMenuBar.module.scss";

export interface EditorMenuBarProps {
  view: EditorView | null;
  onOpenImagePicker?: () => void;
  onToggleFormattingToolbar?: () => void;
  isFormattingToolbarVisible?: boolean;
}

export function EditorMenuBar({
  view,
  onOpenImagePicker,
  onToggleFormattingToolbar,
  isFormattingToolbarVisible = false,
}: EditorMenuBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleInsert = (snippet: string, cursorOffset?: number) => {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const offset = cursorOffset ?? snippet.length;
    view.dispatch({
      changes: { from, to, insert: snippet },
      selection: { anchor: from + offset },
      userEvent: "input",
    });
    view.focus();
    setIsOpen(false);
  };

  return (
    <nav className={styles["menu-bar"]} ref={menuRef} aria-label="Editor menu">
      <div className={styles["menu-bar__tabs"]}>
        <button
          type="button"
          className={`${styles["menu-bar__tab-btn"]} ${isOpen ? styles["is-active"] : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          Insert
        </button>
        <button
          type="button"
          className={`${styles["menu-bar__tab-btn"]} ${
            isFormattingToolbarVisible ? styles["is-active"] : ""
          }`}
          onClick={onToggleFormattingToolbar}
        >
          Format
        </button>
        <button
          type="button"
          className={styles["menu-bar__tab-btn"]}
          onClick={() => handleInsert("%% Note note %%\n")}
        >
          Tools
        </button>
        <button
          type="button"
          className={styles["menu-bar__tab-btn"]}
          onClick={() =>
            window.alert(
              "Markdown Shortcuts:\n- Heading: # Title\n- Bold: **text**\n- Italic: *text*\n- List: - item or 1. item\n- Task: - [ ] item\n- Code: ```js\n- Math: $formula$",
            )
          }
        >
          Help
        </button>
      </div>

      {isOpen && (
        <EditorMenuBarDropdown
          onInsert={handleInsert}
          onOpenImagePicker={() => {
            onOpenImagePicker?.();
            setIsOpen(false);
          }}
        />
      )}
    </nav>
  );
}
