import { Microphone } from "@phosphor-icons/react";
import type { QuickCaptureMode } from "./QuickCaptureHeader";
import { QuickCaptureHints } from "./QuickCaptureHints";
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
  onDismiss,
  onQuit,
  onRecord,
}: QuickCaptureFooterProps) {
  return (
    <div className={styles["quick-capture-footer"]}>
      <QuickCaptureHints mode={mode} />
      <div className={styles["quick-capture-actions"]}>
        {mode === "capture" && (
          <>
            {onRecord && (
              <button
                type="button"
                className={styles["quick-capture-record-btn"]}
                onClick={onRecord}
                aria-label="Start recording"
              >
                <Microphone size={16} weight="bold" />
                <span>Start Recording</span>
              </button>
            )}
            <button
              type="button"
              className={styles["quick-capture-save-btn"]}
              onClick={onSave}
              disabled={!canSave}
              aria-label="Save note"
            >
              Save note
            </button>
          </>
        )}
        <button
          type="button"
          className={styles["quick-capture-close-btn"]}
          onClick={onDismiss}
          aria-label="Close quick capture"
        >
          Close
        </button>
        {onQuit && (
          <button
            type="button"
            className={styles["quick-capture-quit-btn"]}
            onClick={onQuit}
            aria-label="Quit application"
          >
            Quit
          </button>
        )}
      </div>
    </div>
  );
}
