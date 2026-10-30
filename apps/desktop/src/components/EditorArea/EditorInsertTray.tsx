import { useState } from "react";
import type { EditorView } from "@codemirror/view";
import {
  Table,
  ShareNetwork,
  GitBranch,
  Quotes,
  Function as FunctionIcon,
  Code,
  X,
  Image as ImageIcon,
  ChatText,
} from "@phosphor-icons/react";
import {
  INSERT_CATEGORIES,
  INSERT_CATALOG_ITEMS,
  type InsertCatalogItem,
} from "./insertCatalog";
import { TableGridPicker } from "./TableGridPicker";
import { insertTableAtCursor } from "./tableSnippetGenerator";
import styles from "./EditorInsertTray.module.scss";

export interface EditorInsertTrayProps {
  view: EditorView | null;
  onClose: () => void;
  onOpenImagePicker?: () => void;
}

function getItemIcon(item: InsertCatalogItem) {
  switch (item.category) {
    case "diagrams":
      if (item.id === "mermaid-git") {
        return <GitBranch size={16} weight="regular" />;
      }
      return <ShareNetwork size={16} weight="regular" />;
    case "tables":
      return <Table size={16} weight="regular" />;
    case "callouts":
      if (item.id === "callout-quote") {
        return <Quotes size={16} weight="regular" />;
      }
      return <ChatText size={16} weight="regular" />;
    case "media":
      if (item.id.startsWith("math")) {
        return <FunctionIcon size={16} weight="regular" />;
      }
      return <ImageIcon size={16} weight="regular" />;
    case "code":
    default:
      return <Code size={16} weight="regular" />;
  }
}

export function EditorInsertTray({
  view,
  onClose,
  onOpenImagePicker,
}: EditorInsertTrayProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredItems =
    activeCategory === "all"
      ? INSERT_CATALOG_ITEMS
      : INSERT_CATALOG_ITEMS.filter((item) => item.category === activeCategory);

  const handleInsert = (item: InsertCatalogItem) => {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const insertText = item.template;
    const targetCursor = from + (item.cursorOffset ?? insertText.length);

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: targetCursor },
      userEvent: "input",
    });
    view.focus();
  };

  return (
    <div
      className={styles["editor-insert-tray"]}
      role="region"
      aria-label="Editor insert tray"
    >
      <div className={styles["editor-insert-tray__header"]}>
        <div className={styles["editor-insert-tray__categories"]}>
          {INSERT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles["editor-insert-tray__category-btn"]} ${
                activeCategory === cat.id ? styles["is-active"] : ""
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
          {onOpenImagePicker && (
            <button
              type="button"
              className={styles["editor-insert-tray__category-btn"]}
              onClick={onOpenImagePicker}
              title="Upload / browse image from disk"
            >
              Upload Image...
            </button>
          )}
        </div>
        <button
          type="button"
          className={styles["editor-insert-tray__close-btn"]}
          title="Close insert tray"
          aria-label="Close insert tray"
          onClick={onClose}
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {activeCategory === "tables" && (
        <div className={styles["editor-insert-tray__custom-table"]}>
          <span className={styles["editor-insert-tray__section-label"]}>
            Custom Size Table (Drag or click to choose dimensions):
          </span>
          <TableGridPicker
            onSelect={(cols, rows) => {
              if (!view) return;
              insertTableAtCursor(view, cols, rows);
            }}
          />
        </div>
      )}

      <div className={styles["editor-insert-tray__grid"]}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles["editor-insert-tray__card"]}
            onClick={() => handleInsert(item)}
            title={item.title}
          >
            <div className={styles["editor-insert-tray__icon-box"]}>
              {getItemIcon(item)}
            </div>
            <div className={styles["editor-insert-tray__card-content"]}>
              <span className={styles["editor-insert-tray__card-title"]}>
                {item.title}
              </span>
              <span className={styles["editor-insert-tray__card-desc"]}>
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
