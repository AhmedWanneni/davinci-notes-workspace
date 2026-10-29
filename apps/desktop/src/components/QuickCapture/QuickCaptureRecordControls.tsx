import type { RecordState } from "./useQuickRecord";
import styles from "./QuickCaptureRecord.module.scss";

export interface QuickCaptureRecordControlsProps {
  status: RecordState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function QuickCaptureRecordControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onSave,
  onDiscard,
  onCancel,
}: QuickCaptureRecordControlsProps) {
  return (
    <div className={styles["record-controls"]}>
      <div className={styles["record-action-group"]}>
        {status === "idle" && (
          <button
            type="button"
            className={styles["record-btn-primary"]}
            onClick={onStart}
            aria-label="Start recording"
          >
            ● Record
          </button>
        )}

        {status === "recording" && (
          <>
            <button
              type="button"
              className={styles["record-btn-secondary"]}
              onClick={onPause}
              aria-label="Pause recording"
            >
              ⏸ Pause
            </button>
            <button
              type="button"
              className={styles["record-btn-primary"]}
              onClick={onStop}
              aria-label="Stop recording"
            >
              ■ Done
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              type="button"
              className={styles["record-btn-secondary"]}
              onClick={onResume}
              aria-label="Resume recording"
            >
              ▶ Resume
            </button>
            <button
              type="button"
              className={styles["record-btn-primary"]}
              onClick={onStop}
              aria-label="Stop recording"
            >
              ■ Done
            </button>
          </>
        )}

        {status === "recorded" && (
          <>
            <button
              type="button"
              className={styles["record-btn-primary"]}
              onClick={onSave}
              aria-label="Save audio note"
            >
              ✓ Save Note
            </button>
            <button
              type="button"
              className={styles["record-btn-secondary"]}
              onClick={onDiscard}
              aria-label="Discard recording"
            >
              Discard
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className={styles["record-btn-secondary"]}
        onClick={onCancel}
        aria-label="Cancel"
      >
        Cancel
      </button>
    </div>
  );
}
