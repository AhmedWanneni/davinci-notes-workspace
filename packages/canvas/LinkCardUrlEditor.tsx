import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type JSX,
  type KeyboardEvent,
} from "react";
import { Check, X } from "@phosphor-icons/react";
import { sanitizeWebUrl } from "./linkCardUtils";
import styles from "./LinkCardNode.module.scss";

export interface LinkCardUrlEditorProps {
  currentUrl: string;
  onSave: (newUrl: string) => void;
  onCancel: () => void;
}

function LinkCardUrlEditorComponent({
  currentUrl,
  onSave,
  onCancel,
}: LinkCardUrlEditorProps): JSX.Element {
  const [draft, setDraft] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      const sanitized = sanitizeWebUrl(draft);
      if (!sanitized) {
        setError("Please enter a valid web URL (e.g. https://example.com)");
        return;
      }
      setError(null);
      onSave(sanitized);
    },
    [draft, onSave],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <form
      className={`${styles["link-card__url-editor"]} nodrag nowheel nopan`}
      onSubmit={handleSubmit}
      data-testid="link-card-url-editor"
    >
      <div className={styles["link-card__editor-row"]}>
        <input
          ref={inputRef}
          type="text"
          className={styles["link-card__url-input"]}
          value={draft}
          placeholder="https://example.com"
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Webpage URL"
          data-testid="link-card-url-input"
        />
        <button
          type="submit"
          className={styles["link-card__editor-btn"]}
          title="Save URL"
          aria-label="Save URL"
          data-testid="link-card-url-save-btn"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          className={styles["link-card__editor-btn"]}
          onClick={onCancel}
          title="Cancel"
          aria-label="Cancel"
          data-testid="link-card-url-cancel-btn"
        >
          <X size={14} />
        </button>
      </div>
      {error && (
        <span className={styles["link-card__editor-error"]}>{error}</span>
      )}
    </form>
  );
}

export const LinkCardUrlEditor = memo(LinkCardUrlEditorComponent);
