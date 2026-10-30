import type { EditorView } from "@codemirror/view";
import { ArrowUUpLeft, ArrowUUpRight, Plus } from "@phosphor-icons/react";
import {
  handleUndo,
  handleRedo,
  handleHeadingChange,
  handleCodeBlock,
} from "./formattingCommands";
import {
  FormatInlineGroup,
  FormatInsertGroup,
  FormatListGroup,
} from "./EditorFormattingToolbarButtons";
import styles from "./EditorFormattingToolbar.module.scss";

interface EditorFormattingToolbarProps {
  view: EditorView | null;
  isInsertOpen?: boolean;
  onOpenInsertMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenImagePicker?: () => void;
}

export function EditorFormattingToolbar({
  view,
  isInsertOpen = false,
  onOpenInsertMenu,
  onOpenImagePicker,
}: EditorFormattingToolbarProps) {
  const run = (action: (editorView: EditorView) => void) => {
    if (!view) return;
    action(view);
    view.focus();
  };

  const onSelectHeading = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    if (val === "code-block") {
      run(handleCodeBlock);
    } else {
      const level = parseInt(val, 10);
      run((v) => handleHeadingChange(v, level));
    }
    event.target.value = "paragraph";
  };

  return (
    <div
      className={styles["editor-formatting-toolbar"]}
      role="toolbar"
      aria-label="Editor formatting toolbar"
    >
      <div className={styles["editor-formatting-toolbar__group"]}>
        <button
          type="button"
          className={styles["editor-formatting-toolbar__button"]}
          title="Undo (Ctrl/Cmd+Z)"
          aria-label="Undo"
          onClick={() => run(handleUndo)}
        >
          <ArrowUUpLeft size={15} weight="regular" />
        </button>
        <button
          type="button"
          className={styles["editor-formatting-toolbar__button"]}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          aria-label="Redo"
          onClick={() => run(handleRedo)}
        >
          <ArrowUUpRight size={15} weight="regular" />
        </button>
      </div>

      <div className={styles["editor-formatting-toolbar__divider"]} />

      <select
        className={styles["editor-formatting-toolbar__select"]}
        aria-label="Text style"
        defaultValue="paragraph"
        onChange={onSelectHeading}
      >
        <option value="paragraph">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="code-block">Code Block</option>
      </select>

      <div className={styles["editor-formatting-toolbar__divider"]} />

      <FormatInlineGroup run={run} />

      <div className={styles["editor-formatting-toolbar__divider"]} />

      <FormatInsertGroup run={run} onOpenImagePicker={onOpenImagePicker} />

      <div className={styles["editor-formatting-toolbar__divider"]} />

      <FormatListGroup run={run} />

      {onOpenInsertMenu && (
        <>
          <div className={styles["editor-formatting-toolbar__divider"]} />
          <button
            type="button"
            className={`${styles["editor-formatting-toolbar__more-button"]} ${
              isInsertOpen ? styles["is-active"] : ""
            }`}
            title="Insert More (Diagrams, Math, Callouts...)"
            aria-label="Insert More"
            aria-expanded={isInsertOpen}
            onClick={onOpenInsertMenu}
          >
            <Plus size={14} weight="bold" />
            <span>Insert</span>
          </button>
        </>
      )}
    </div>
  );
}
