import { useEffect } from "react";
import styles from "./FormatToast.module.scss";

export interface FormatToastProps {
  message: string;
  hasUndo?: boolean;
  onUndo?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function FormatToast({
  message,
  hasUndo,
  onUndo,
  onDismiss,
  durationMs = 2500,
}: FormatToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className={styles["format-toast"]} role="status" aria-live="polite">
      <span className={styles["format-toast__message"]}>{message}</span>
      {hasUndo && onUndo && (
        <>
          <span className={styles["format-toast__divider"]}>·</span>
          <button
            type="button"
            className={styles["format-toast__undo-btn"]}
            onClick={() => {
              onUndo();
              onDismiss();
            }}
          >
            Undo
          </button>
        </>
      )}
    </div>
  );
}
