import type { QuickCaptureMode } from "./QuickCaptureHeader";
import styles from "./QuickCapture.module.scss";

export interface QuickCaptureHintsProps {
  mode: QuickCaptureMode;
}

export function QuickCaptureHints({ mode }: QuickCaptureHintsProps) {
  return (
    <div className={styles["quick-capture-hints"]}>
      {mode === "capture" ? (
        <>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⌘S</kbd> Save
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Tab</kbd> Options
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⌘K</kbd> Search
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Esc</kbd> Quit
          </span>
        </>
      ) : mode === "reminder" ? (
        <>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⌘S/⏎</kbd> Save reminder
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Esc</kbd> Quit
          </span>
        </>
      ) : mode === "record" ? (
        <>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Space</kbd> Record/Pause
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>⌘S</kbd> Save note
          </span>
          <span className={styles["quick-capture-hint-item"]}>
            <kbd className={styles["quick-capture-kbd"]}>Esc</kbd> Quit
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
