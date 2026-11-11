import { useState, useRef, useEffect } from "react";
import type { EditorView } from "@codemirror/view";
import {
  DotsThree,
  Eye,
  Code,
  FilePdf,
  TextAlignLeft,
} from "@phosphor-icons/react";
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
  editorPadding?: "default" | "wide";
  onEditorPaddingChange?: (padding: "default" | "wide") => void;
  showProperties?: boolean;
  onToggleProperties?: () => void;
  onFormatNote?: () => void;
}

export function EditorMenuBar({
  view,
  onOpenImagePicker,
  editorMode = "preview",
  onModeChange,
  onExportPdf,
  editorPadding = "default",
  onEditorPaddingChange,
  showProperties = false,
  onToggleProperties,
  onFormatNote,
}: EditorMenuBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const insertRef = useRef<HTMLDivElement>(null);
  const [insertAlign, setInsertAlign] = useState<"left" | "right">("left");

  const positionMenus = () => {
    const trigger = menuRef.current?.querySelector(
      "button[aria-label='More editor actions']",
    );
    const menu = menuRef.current?.querySelector<HTMLElement>(
      "[aria-label='Editor actions']",
    );
    if (!trigger || !menu) return;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    const openAbove =
      window.innerHeight - triggerRect.bottom < menuRect.height + margin &&
      triggerRect.top > window.innerHeight - triggerRect.bottom;
    const left = Math.max(
      margin,
      Math.min(triggerRect.left, window.innerWidth - menuRect.width - margin),
    );
    const top = openAbove
      ? Math.max(margin, triggerRect.top - menuRect.height - 4)
      : Math.min(
          window.innerHeight - menuRect.height - margin,
          triggerRect.bottom + 4,
        );
    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.right = "auto";
    menu.style.bottom = "auto";
  };

  useEffect(() => {
    if (!isOpen) return;
    positionMenus();
    const onViewportChange = () => positionMenus();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [isOpen, isInsertOpen]);

  useEffect(() => {
    if (!isInsertOpen) return;
    const parent = menuRef.current?.querySelector<HTMLElement>(
      "[aria-label='Editor actions']",
    );
    const submenu =
      insertRef.current?.querySelector<HTMLElement>("[role='menu']");
    if (!parent || !submenu) return;
    const parentRect = parent.getBoundingClientRect();
    const submenuRect = submenu.getBoundingClientRect();
    const margin = 8;
    const rightSpace = window.innerWidth - parentRect.right;
    const leftSpace = parentRect.left;
    const side =
      rightSpace >= submenuRect.width || rightSpace >= leftSpace
        ? "right"
        : "left";
    const left =
      side === "right"
        ? Math.min(
            parentRect.right - 1,
            window.innerWidth - submenuRect.width - margin,
          )
        : Math.max(margin, parentRect.left - submenuRect.width + 1);
    const top = Math.max(
      margin,
      Math.min(
        parentRect.top,
        window.innerHeight - submenuRect.height - margin,
      ),
    );
    setInsertAlign(side);
    submenu.style.position = "fixed";
    submenu.style.left = `${left}px`;
    submenu.style.top = `${top}px`;
    submenu.style.right = "auto";
    submenu.style.bottom = "auto";
  }, [isInsertOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !insertRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setIsInsertOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isInsertOpen) setIsInsertOpen(false);
        else setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isInsertOpen]);

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
    setIsInsertOpen(false);
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
          className={`${styles["menu-bar__more-btn"]} ${isOpen ? styles["is-active"] : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="More editor actions"
          title="More editor actions"
        >
          <DotsThree size={20} weight="bold" />
        </button>

        {isOpen && (
          <div
            className={styles["menu-bar__more-menu"]}
            role="menu"
            aria-label="Editor actions"
          >
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitem"
              aria-label="Open insert menu"
              aria-expanded={isInsertOpen}
              onClick={() => setIsInsertOpen((v) => !v)}
            >
              Insert <span aria-hidden="true">›</span>
            </button>
            <div className={styles["menu-bar__divider"]} />
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitemradio"
              aria-checked={editorPadding === "default"}
              onClick={() => onEditorPaddingChange?.("default")}
            >
              <span className={styles["menu-bar__check"]}>
                {editorPadding === "default" ? "✓" : ""}
              </span>
              Full width
            </button>
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitemradio"
              aria-checked={editorPadding === "wide"}
              onClick={() => onEditorPaddingChange?.("wide")}
            >
              <span className={styles["menu-bar__check"]}>
                {editorPadding === "wide" ? "✓" : ""}
              </span>
              Readable width
            </button>
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitemcheckbox"
              aria-checked={showProperties}
              onClick={() => onToggleProperties?.()}
            >
              <span className={styles["menu-bar__check"]}>
                {showProperties ? "✓" : ""}
              </span>
              {showProperties ? "Hide properties" : "Show properties"}
            </button>
            <div className={styles["menu-bar__divider"]} />
            <div
              className={styles["menu-bar__mode-group"]}
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
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitem"
              onClick={() => {
                onFormatNote?.();
                setIsOpen(false);
              }}
              title="Organize and format markdown (Cmd/Ctrl+Shift+F)"
            >
              <TextAlignLeft size={15} /> Format note
            </button>
            <button
              type="button"
              className={styles["menu-bar__more-item"]}
              role="menuitem"
              onClick={() => {
                handleExportPdf();
                setIsOpen(false);
              }}
              title="Convert / Export note to PDF"
            >
              <FilePdf size={15} /> Convert / Export to PDF
            </button>
          </div>
        )}
        {isInsertOpen && (
          <div
            ref={insertRef}
            className={`${styles["menu-bar__insert-popover"]} ${styles[`is-align-${insertAlign}`]}`}
          >
            <EditorMenuBarDropdown
              onInsert={handleInsert}
              onOpenImagePicker={() => {
                onOpenImagePicker?.();
                setIsOpen(false);
                setIsInsertOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </nav>
  );
}
