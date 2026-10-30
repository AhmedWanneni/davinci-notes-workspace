import { useState } from "react";
import type { EditorView } from "@codemirror/view";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Highlighter,
  Code,
  Link,
  Image as ImageIcon,
  Table as TableIcon,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Minus,
} from "@phosphor-icons/react";
import {
  handleBold,
  handleItalic,
  handleUnderline,
  handleStrikethrough,
  handleHighlight,
  handleInlineCode,
  handleBulletList,
  handleNumberedList,
  handleTaskList,
  handleQuote,
  handleDivider,
  handleLink,
} from "./formattingCommands";
import { TableGridPopover } from "./TableGridPopover";
import { insertTableAtCursor } from "./tableSnippetGenerator";
import styles from "./EditorFormattingToolbar.module.scss";

interface ToolbarRunProps {
  run: (action: (view: EditorView) => void) => void;
}

export function FormatInlineGroup({ run }: ToolbarRunProps) {
  return (
    <div className={styles["editor-formatting-toolbar__group"]}>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Bold (**text**)"
        aria-label="Bold"
        onClick={() => run(handleBold)}
      >
        <TextB size={15} weight="bold" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Italic (*text*)"
        aria-label="Italic"
        onClick={() => run(handleItalic)}
      >
        <TextItalic size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Underline (<u>text</u>)"
        aria-label="Underline"
        onClick={() => run(handleUnderline)}
      >
        <TextUnderline size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Strikethrough (~~text~~)"
        aria-label="Strikethrough"
        onClick={() => run(handleStrikethrough)}
      >
        <TextStrikethrough size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Highlight (==text==)"
        aria-label="Highlight"
        onClick={() => run(handleHighlight)}
      >
        <Highlighter size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Inline Code (`text`)"
        aria-label="Inline Code"
        onClick={() => run(handleInlineCode)}
      >
        <Code size={15} weight="regular" />
      </button>
    </div>
  );
}

interface FormatInsertGroupProps extends ToolbarRunProps {
  onOpenImagePicker?: () => void;
}

export function FormatInsertGroup({
  run,
  onOpenImagePicker,
}: FormatInsertGroupProps) {
  const [tableAnchorRect, setTableAnchorRect] = useState<DOMRect | null>(null);

  const onSelectCustomTable = (cols: number, rows: number) => {
    run((v) => insertTableAtCursor(v, cols, rows));
    setTableAnchorRect(null);
  };

  return (
    <div className={styles["editor-formatting-toolbar__group"]}>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Link ([text](url))"
        aria-label="Link"
        onClick={() => run(handleLink)}
      >
        <Link size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Insert Image"
        aria-label="Insert Image"
        onClick={() => {
          if (onOpenImagePicker) {
            onOpenImagePicker();
          } else {
            run((v) =>
              v.dispatch({
                changes: { from: v.state.selection.main.from, insert: "![[]]" },
              }),
            );
          }
        }}
      >
        <ImageIcon size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={`${styles["editor-formatting-toolbar__button"]} ${
          tableAnchorRect ? styles["is-active"] : ""
        }`}
        title="Insert Table (Click to choose dimensions)"
        aria-label="Table"
        aria-expanded={Boolean(tableAnchorRect)}
        onClick={(e) => {
          if (tableAnchorRect) {
            setTableAnchorRect(null);
          } else {
            setTableAnchorRect(e.currentTarget.getBoundingClientRect());
          }
        }}
      >
        <TableIcon size={15} weight="regular" />
      </button>
      {tableAnchorRect && (
        <TableGridPopover
          anchorRect={tableAnchorRect}
          onSelect={onSelectCustomTable}
          onClose={() => setTableAnchorRect(null)}
        />
      )}
    </div>
  );
}

export function FormatListGroup({ run }: ToolbarRunProps) {
  return (
    <div className={styles["editor-formatting-toolbar__group"]}>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Bullet List (- item)"
        aria-label="Bullet List"
        onClick={() => run(handleBulletList)}
      >
        <ListBullets size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Numbered List (1. item)"
        aria-label="Numbered List"
        onClick={() => run(handleNumberedList)}
      >
        <ListNumbers size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Task List (- [ ] task)"
        aria-label="Task List"
        onClick={() => run(handleTaskList)}
      >
        <CheckSquare size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Quote (> quote)"
        aria-label="Quote"
        onClick={() => run(handleQuote)}
      >
        <Quotes size={15} weight="regular" />
      </button>
      <button
        type="button"
        className={styles["editor-formatting-toolbar__button"]}
        title="Horizontal Rule (---)"
        aria-label="Horizontal Rule"
        onClick={() => run(handleDivider)}
      >
        <Minus size={15} weight="regular" />
      </button>
    </div>
  );
}
