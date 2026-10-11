import styles from "./QuickCapture.module.scss";

export interface QuickCaptureHeaderProps {
  mode: "capture" | "search";
  onModeChange: (mode: "capture" | "search") => void;
  charCount: number;
  maxChars: number;
  selectedIndex: number;
  resultCount: number;
  onDismiss?: () => void;
}

export function QuickCaptureHeader({
  mode,
  onModeChange,
  charCount,
  maxChars,
  selectedIndex,
  resultCount,
  onDismiss,
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
        ) : (
          <span className={styles["quick-capture-counter"]}>
            {resultCount > 0 ? `${selectedIndex + 1} of ${resultCount}` : ""}
          </span>
        )}
        {onDismiss && (
          <button
            type="button"
            className={styles["quick-capture-quit-btn"]}
            onClick={onDismiss}
            aria-label="Quit quick capture"
            title="Quit (Esc)"
          >
            Quit
          </button>
        )}
      </div>
    </div>
  );
}
