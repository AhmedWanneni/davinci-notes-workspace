import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import styles from "./QuickCapture.module.scss";

export const MAX_CAPTURE_CHARS = 10_000;

export interface QuickCaptureProps {
  onSave?: (text: string) => Promise<void> | void;
  onDismiss?: () => Promise<void> | void;
}

export function QuickCapture({ onSave, onDismiss }: QuickCaptureProps) {
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();

    let unlisten: (() => void) | undefined;
    void listen("davinci-capture-focus", () => {
      textareaRef.current?.focus();
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {
        // Ignored when outside Tauri runtime
      });

    const handleWindowFocus = () => {
      textareaRef.current?.focus();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleDismiss = async () => {
    setErrorMessage(null);
    setText("");
    if (onDismiss) {
      await onDismiss();
      return;
    }
    try {
      await invoke("quick_capture_dismiss");
    } catch {
      // Ignored outside Tauri
    }
  };

  const handleSave = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      await handleDismiss();
      return;
    }
    setErrorMessage(null);
    try {
      if (onSave) {
        await onSave(content);
      } else {
        await invoke("quick_capture_save", { text: content });
      }
      setText("");
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to save";
      setErrorMessage(msg);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      void handleDismiss();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSave(text);
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CAPTURE_CHARS * 0.9;

  return (
    <div className={styles["quick-capture-container"]}>
      <div className={styles["quick-capture-header"]}>
        <span className={styles["quick-capture-title"]}>Quick Capture</span>
        <span
          className={`${styles["quick-capture-counter"]} ${
            isNearLimit ? styles["quick-capture-counter-warning"] : ""
          }`}
        >
          {charCount} / {MAX_CAPTURE_CHARS}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        className={styles["quick-capture-textarea"]}
        value={text}
        maxLength={MAX_CAPTURE_CHARS}
        placeholder="Type a thought... (Enter to save, Shift+Enter for newline, Esc to dismiss)"
        onChange={(e) => {
          setText(e.target.value);
          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-label="Quick capture text"
      />

      {errorMessage && (
        <div className={styles["quick-capture-error"]} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles["quick-capture-footer"]}>
        <div className={styles["quick-capture-hints"]}>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⏎</kbd> Save
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⇧⏎</kbd> Newline
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Esc</kbd> Dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
