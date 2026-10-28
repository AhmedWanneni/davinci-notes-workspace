import { Check, ArrowDown, Copy, ChatCircleDots } from "@phosphor-icons/react";
import styles from "./EditorAiSelection.module.scss";

export interface EditorAiSelectionActionsProps {
  result: string;
  selectedText: string;
  prompt: string;
  noteTitle?: string;
  onReplace: (text: string) => void;
  onInsertBelow: (text: string) => void;
  onOpenAgent?: (query: string) => void;
  onClose: () => void;
}

export function EditorAiSelectionActions({
  result,
  selectedText,
  prompt,
  noteTitle,
  onReplace,
  onInsertBelow,
  onOpenAgent,
  onClose,
}: EditorAiSelectionActionsProps) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(result);
  };

  const handleOpenAgent = () => {
    if (!onOpenAgent) return;
    onClose();
    const noteContext = noteTitle ? `from "${noteTitle}"` : "from note";
    onOpenAgent(
      `Regarding this text ${noteContext}:\n"${selectedText}"\n\n${prompt || "Please review or help me with this."}`,
    );
  };

  return (
    <div className={styles["editor-ai-selection__actions"]}>
      <button
        type="button"
        className={`${styles["editor-ai-selection__action-btn"]} ${styles["is-primary"]}`}
        onClick={() => onReplace(result)}
      >
        <Check size={14} weight="bold" />
        <span>Replace</span>
      </button>
      <button
        type="button"
        className={styles["editor-ai-selection__action-btn"]}
        onClick={() => onInsertBelow(result)}
      >
        <ArrowDown size={14} weight="bold" />
        <span>Insert Below</span>
      </button>
      <button
        type="button"
        className={styles["editor-ai-selection__action-btn"]}
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        <Copy size={14} weight="regular" />
        <span>Copy</span>
      </button>
      {onOpenAgent && (
        <button
          type="button"
          className={styles["editor-ai-selection__action-btn"]}
          onClick={handleOpenAgent}
          title="Continue in Agent view"
        >
          <ChatCircleDots size={14} weight="regular" />
          <span>Ask in Agent</span>
        </button>
      )}
    </div>
  );
}
