import styles from "./QuickCaptureHeader.module.scss";

export type QuickCaptureMode = "capture" | "reminder" | "record" | "search";

export interface QuickCaptureHeaderProps {
  mode: QuickCaptureMode;
  onModeChange: (mode: QuickCaptureMode) => void;
  charCount: number;
  maxChars: number;
  selectedIndex: number;
  resultCount: number;
  onDismiss?: () => void;
  onQuit?: () => void;
}

export function QuickCaptureHeader({
  mode,
  onModeChange,
  charCount,
  maxChars,
  selectedIndex,
  resultCount,
  onDismiss,
  onQuit,
}: QuickCaptureHeaderProps) {
  const isNearLimit = charCount > maxChars * 0.9;

  return (
    <div className={styles["quick-capture-header"]}>
      <div className={styles["quick-capture-tabs"]} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "capture"}
          className={`${styles["quick-capture-tab-btn"]} ${
            mode === "capture" ? styles["is-active"] : ""
          }`}
          onClick={() => onModeChange("capture")}
        >
          Capture
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "reminder"}
          className={`${styles["quick-capture-tab-btn"]} ${
            mode === "reminder" ? styles["is-active"] : ""
          }`}
          onClick={() => onModeChange("reminder")}
        >
          Reminder
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "record"}
          className={`${styles["quick-capture-tab-btn"]} ${
            mode === "record" ? styles["is-active"] : ""
          }`}
          onClick={() => onModeChange("record")}
        >
          🎙️ Record
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "search"}
          className={`${styles["quick-capture-tab-btn"]} ${
            mode === "search" ? styles["is-active"] : ""
          }`}
          onClick={() => onModeChange("search")}
        >
          Search
        </button>
      </div>
      <div className={styles["quick-capture-header-right"]}>
        {mode === "capture" ? (
          <span
            className={`${styles["quick-capture-counter"]} ${
              isNearLimit ? styles["quick-capture-counter-warning"] : ""
            }`}
          >
            {charCount} / {maxChars}
          </span>
        ) : mode === "reminder" ? (
          <span className={styles["quick-capture-counter"]}>Add reminder</span>
        ) : mode === "record" ? (
          <span className={styles["quick-capture-counter"]}>Voice record</span>
        ) : (
          <span className={styles["quick-capture-counter"]}>
            {resultCount > 0 ? `${selectedIndex + 1} of ${resultCount}` : ""}
          </span>
        )}
        {onDismiss && (
          <button
            type="button"
            className={styles["quick-capture-close-btn"]}
            onClick={onDismiss}
            aria-label="Close quick capture"
            title="Close (Esc)"
          >
            Close
          </button>
        )}
        {onQuit && (
          <button
            type="button"
            className={styles["quick-capture-quit-btn"]}
            onClick={onQuit}
            aria-label="Quit application"
            title="Quit application completely (⌘Q)"
          >
            Quit
          </button>
        )}
      </div>
    </div>
  );
}
