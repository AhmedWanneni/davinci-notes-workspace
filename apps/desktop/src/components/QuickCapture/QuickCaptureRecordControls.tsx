import { Microphone, Pause, Play, Stop, Check, Trash, X } from "@phosphor-icons/react";
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
            <Microphone size={16} weight="bold" />
            <span>Start Recording</span>
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
              <Pause size={14} weight="bold" />
              <span>Pause</span>
            </button>
            <button
              type="button"
              className={styles["record-btn-primary"]}
              onClick={onStop}
              aria-label="Stop recording"
            >
              <Stop size={14} weight="bold" />
              <span>Done (Stop)</span>
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
              <Play size={14} weight="bold" />
              <span>Resume</span>
            </button>
            <button
              type="button"
              className={styles["record-btn-primary"]}
              onClick={onStop}
              aria-label="Stop recording"
            >
              <Stop size={14} weight="bold" />
              <span>Done (Stop)</span>
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
              <Check size={14} weight="bold" />
              <span>Save Note</span>
            </button>
            <button
              type="button"
              className={styles["record-btn-secondary"]}
              onClick={onDiscard}
              aria-label="Discard recording"
            >
              <Trash size={14} weight="bold" />
              <span>Discard</span>
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
        <X size={14} weight="bold" />
        <span>Cancel</span>
      </button>
    </div>
  );
}
