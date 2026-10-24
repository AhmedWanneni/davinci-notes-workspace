import type { QuickCaptureMode } from "./QuickCaptureHeader";
import { QuickCaptureHints } from "./QuickCaptureHints";
import styles from "./QuickCapture.module.scss";

export interface QuickCaptureFooterProps {
  mode: QuickCaptureMode;
  canSave: boolean;
  onSave: () => void;
  onDismiss: () => void;
}

export function QuickCaptureFooter({
  mode,
  canSave,
  onSave,
  onDismiss,
}: QuickCaptureFooterProps) {
  return (
    <div className={styles["quick-capture-footer"]}>
      <QuickCaptureHints mode={mode} />
      <div className={styles["quick-capture-actions"]}>
        {mode === "capture" && (
          <button
            type="button"
            className={styles["quick-capture-save-btn"]}
            onClick={onSave}
            disabled={!canSave}
            aria-label="Save note"
          >
            Save note
          </button>
        )}
        <button
          type="button"
          className={styles["quick-capture-quit-btn"]}
          onClick={onDismiss}
          aria-label="Quit quick capture"
        >
          Quit
        </button>
      </div>
    </div>
  );
}
