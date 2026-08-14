import type { JSX } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  CornersOut,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  TextT,
} from "@phosphor-icons/react";
import styles from "./CanvasView.module.scss";

export interface CanvasControlsProps {
  onCreateTextCard: () => void;
}

export function CanvasControls({
  onCreateTextCard,
}: CanvasControlsProps): JSX.Element {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <div
      className={styles["canvas-controls"]}
      aria-label="Canvas navigation controls"
    >
      <button
        type="button"
        className={styles["canvas-controls__btn"]}
        onClick={onCreateTextCard}
        aria-label="Add Text Card"
        title="Add Text Card"
      >
        <TextT size={15} />
      </button>
      <button
        type="button"
        className={styles["canvas-controls__btn"]}
        onClick={() => void zoomIn({ duration: 200 })}
        aria-label="Zoom In"
        title="Zoom In"
      >
        <MagnifyingGlassPlus size={15} />
      </button>
      <button
        type="button"
        className={styles["canvas-controls__btn"]}
        onClick={() => void zoomOut({ duration: 200 })}
        aria-label="Zoom Out"
        title="Zoom Out"
      >
        <MagnifyingGlassMinus size={15} />
      </button>
      <button
        type="button"
        className={styles["canvas-controls__btn"]}
        onClick={() => void fitView({ duration: 300, padding: 0.2 })}
        aria-label="Zoom to Fit"
        title="Zoom to Fit"
      >
        <CornersOut size={15} />
      </button>
    </div>
  );
}
