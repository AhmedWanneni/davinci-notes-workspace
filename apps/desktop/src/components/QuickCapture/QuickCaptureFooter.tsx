import type { QuickCaptureMode } from "./QuickCaptureHeader";
import styles from "./QuickCaptureFooter.module.scss";

export interface QuickCaptureFooterProps {
  mode: QuickCaptureMode;
  canSave: boolean;
  onSave: () => void;
  onDismiss: () => void;
  onQuit?: () => void;
  onRecord?: () => void;
}

export function QuickCaptureFooter({
  mode,
  canSave,
  onSave,
}: QuickCaptureFooterProps) {
  return (
    <div className={styles["quick-capture-footer"]}>
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
      </div>
    </div>
  );
}
