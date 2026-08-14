import type { JSX } from "react";
import styles from "./CanvasView.module.scss";

export function CanvasEmptyState(): JSX.Element {
  return (
    <div
      className={styles["canvas-empty-state"]}
      data-testid="canvas-empty-state"
    >
      <div className={styles["canvas-empty-state__title"]}>Empty Canvas</div>
      <div className={styles["canvas-empty-state__description"]}>
        Double-click anywhere to add a text card.
      </div>
      <div className={styles["canvas-empty-state__hints"]}>
        <div className={styles["canvas-empty-state__hint-row"]}>
          <span>Add Text Card</span>
          <span className={styles["canvas-empty-state__key"]}>
            Double-click
          </span>
        </div>
        <div className={styles["canvas-empty-state__hint-row"]}>
          <span>Pan Canvas</span>
          <span className={styles["canvas-empty-state__key"]}>
            Space + Drag / Middle Click
          </span>
        </div>
      </div>
    </div>
  );
}
