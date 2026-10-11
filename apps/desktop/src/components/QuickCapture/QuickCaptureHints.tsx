import styles from "./QuickCapture.module.scss";

export interface QuickCaptureHintsProps {
  mode: "capture" | "search";
}

export function QuickCaptureHints({ mode }: QuickCaptureHintsProps) {
  return (
    <div className={styles["quick-capture-hints"]}>
      {mode === "capture" ? (
        <>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⏎</kbd> Save
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⇧⏎</kbd> Newline
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Tab</kbd> Search
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Esc</kbd> Dismiss
          </span>
        </>
      ) : (
        <>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>↑↓</kbd> Navigate
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⏎</kbd> Open
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Tab/Esc</kbd> Capture
          </span>
        </>
      )}
    </div>
  );
}
