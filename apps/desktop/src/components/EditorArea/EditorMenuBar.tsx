import { useState, useRef, useEffect } from "react";
import type { EditorView } from "@codemirror/view";
import { Eye, Code, FilePdf } from "@phosphor-icons/react";
import { EditorMenuBarDropdown } from "./EditorMenuBarDropdown";
import { exportNoteToPdf } from "./exportNoteToPdf";
import styles from "./EditorMenuBar.module.scss";

export interface EditorMenuBarProps {
  view: EditorView | null;
  onOpenImagePicker?: () => void;
  onToggleFormattingToolbar?: () => void;
  isFormattingToolbarVisible?: boolean;
  editorMode?: "preview" | "code";
  onModeChange?: (mode: "preview" | "code") => void;
  onExportPdf?: () => void;
}

export function EditorMenuBar({
  view,
  onOpenImagePicker,
  editorMode = "preview",
  onModeChange,
  onExportPdf,
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

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      void exportNoteToPdf();
    }
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

        <div className={styles["menu-bar__divider-v"]} />

        <div
          className={styles["menu-bar__segment-group"]}
          role="group"
          aria-label="Editor mode"
        >
          <button
            type="button"
            className={`${styles["menu-bar__segment-btn"]} ${
              editorMode === "preview" ? styles["is-active"] : ""
            }`}
            onClick={() => onModeChange?.("preview")}
            title="Live Preview mode"
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            type="button"
            className={`${styles["menu-bar__segment-btn"]} ${
              editorMode === "code" ? styles["is-active"] : ""
            }`}
            onClick={() => onModeChange?.("code")}
            title="Raw Markdown code mode"
          >
            <Code size={13} />
            Code
          </button>
        </div>

        <div className={styles["menu-bar__divider-v"]} />

        <button
          type="button"
          className={styles["menu-bar__action-btn"]}
          onClick={handleExportPdf}
          title="Convert / Export note to PDF"
          aria-label="Export to PDF"
        >
          <FilePdf size={14} />
          PDF
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
