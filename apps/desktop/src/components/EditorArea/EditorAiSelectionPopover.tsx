import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sparkle, X, PaperPlaneRight } from "@phosphor-icons/react";
import {
  AI_SELECTION_QUICK_ACTIONS,
  type AiSelectionActionKind,
  type SelectionBounds,
} from "./EditorAiSelectionTypes";
import { executeAiSelectionPrompt } from "./executeAiSelectionPrompt";
import { EditorAiSelectionActions } from "./EditorAiSelectionActions";
import styles from "./EditorAiSelection.module.scss";

export interface EditorAiSelectionPopoverProps {
  bounds: SelectionBounds | null;
  isOpen: boolean;
  noteTitle?: string;
  onClose: () => void;
  onReplace: (text: string) => void;
  onInsertBelow: (text: string) => void;
  onOpenAgent?: (query: string) => void;
}

export function EditorAiSelectionPopover({
  bounds,
  isOpen,
  noteTitle,
  onClose,
  onReplace,
  onInsertBelow,
  onOpenAgent,
}: EditorAiSelectionPopoverProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedAction, setSelectedAction] =
    useState<AiSelectionActionKind>("rewrite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResult(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !bounds || typeof document === "undefined") {
    return null;
  }

  const { rect, text } = bounds;
  const top = Math.min(rect.bottom + 8, window.innerHeight - 380);
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - 376));

  const handleRun = async (
    action: AiSelectionActionKind,
    customPrompt?: string,
  ) => {
    const instruction =
      customPrompt ||
      prompt ||
      AI_SELECTION_QUICK_ACTIONS.find((a) => a.id === action)?.prompt ||
      "Rewrite clearly";

    setLoading(true);
    setError(null);
    try {
      const generated = await executeAiSelectionPrompt({
        selectedText: text,
        instruction,
        action,
        noteTitle,
      });
      setResult(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI edit");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      className={styles["editor-ai-selection__popover"]}
      style={{ top: `${top}px`, left: `${left}px` }}
      role="dialog"
      aria-label="Edit text with AI"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles["editor-ai-selection__header"]}>
        <div className={styles["editor-ai-selection__title"]}>
          <Sparkle size={15} weight="fill" />
          <span>Edit with AI / Comment</span>
        </div>
        <button
          type="button"
          className={styles["editor-ai-selection__close-btn"]}
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      <div className={styles["editor-ai-selection__quote"]} title={text}>
        "{text.length > 120 ? `${text.slice(0, 120)}...` : text}"
      </div>

      <div className={styles["editor-ai-selection__quick-actions"]}>
        {AI_SELECTION_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`${styles["editor-ai-selection__chip"]} ${
              selectedAction === action.id ? styles["is-selected"] : ""
            }`}
            onClick={() => {
              setSelectedAction(action.id);
              setPrompt(action.prompt);
              void handleRun(action.id, action.prompt);
            }}
            title={action.description}
          >
            {action.label}
          </button>
        ))}
      </div>

      <form
        className={styles["editor-ai-selection__input-form"]}
        onSubmit={(e) => {
          e.preventDefault();
          void handleRun(selectedAction, prompt);
        }}
      >
        <div className={styles["editor-ai-selection__input-row"]}>
          <input
            ref={inputRef}
            type="text"
            className={styles["editor-ai-selection__input"]}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to edit, amend, explain..."
            disabled={loading}
          />
          <button
            type="submit"
            className={styles["editor-ai-selection__submit-btn"]}
            disabled={loading || !prompt.trim()}
            title="Send prompt"
          >
            <PaperPlaneRight size={13} weight="fill" />
          </button>
        </div>
      </form>

      {loading && (
        <div className={styles["editor-ai-selection__loading"]}>
          <div className={styles["editor-ai-selection__spinner"]} />
          <span>AI is thinking...</span>
        </div>
      )}

      {error && (
        <div className={styles["editor-ai-selection__error"]}>{error}</div>
      )}

      {result && (
        <div className={styles["editor-ai-selection__result"]}>
          <div className={styles["editor-ai-selection__result-preview"]}>
            {result}
          </div>
          <EditorAiSelectionActions
            result={result}
            selectedText={text}
            prompt={prompt}
            noteTitle={noteTitle}
            onReplace={onReplace}
            onInsertBelow={onInsertBelow}
            onOpenAgent={onOpenAgent}
            onClose={onClose}
          />
        </div>
      )}
    </div>,
    document.body,
  );
}
