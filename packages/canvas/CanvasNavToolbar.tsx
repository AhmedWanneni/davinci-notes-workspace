import { memo, useCallback, type JSX } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  ArrowsClockwise,
  CornersOut,
  Gear,
  Minus,
  Plus,
  Question,
} from "@phosphor-icons/react";
import styles from "./CanvasNavToolbar.module.scss";

export interface CanvasNavToolbarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleSettings?: () => void;
  onToggleHelp?: () => void;
}

function CanvasNavToolbarComponent({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleSettings,
  onToggleHelp,
}: CanvasNavToolbarProps): JSX.Element {
  const { zoomIn, zoomOut, setViewport, getViewport, fitView } = useReactFlow();

  const handleResetZoom = useCallback(() => {
    const { x, y } = getViewport();
    setViewport({ x, y, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleFitView = useCallback(() => {
    void fitView({ duration: 300, padding: 0.2 });
  }, [fitView]);

  return (
    <div
      className={styles["nav-toolbar"]}
      role="toolbar"
      aria-label="Canvas navigation and history"
    >
      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={onToggleSettings}
        title="Canvas settings"
        aria-label="Canvas settings"
      >
        <Gear size={16} />
      </button>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={() => void zoomIn({ duration: 200 })}
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <Plus size={16} />
      </button>

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={handleResetZoom}
        title="Reset zoom (100%)"
        aria-label="Reset zoom"
      >
        <ArrowsClockwise size={16} />
      </button>

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={handleFitView}
        title="Zoom to Fit"
        aria-label="Zoom to Fit"
      >
        <CornersOut size={16} />
      </button>

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={() => void zoomOut({ duration: 200 })}
        title="Zoom Out (-)"
        aria-label="Zoom Out"
      >
        <Minus size={16} />
      </button>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Cmd+Z)"
        aria-label="Undo"
      >
        <ArrowUUpLeft size={16} />
      </button>

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Cmd+Shift+Z)"
        aria-label="Redo"
      >
        <ArrowUUpRight size={16} />
      </button>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles["nav-btn"]}
        onClick={onToggleHelp}
        title="Canvas help & shortcuts"
        aria-label="Canvas help"
      >
        <Question size={16} />
      </button>
    </div>
  );
}

export const CanvasNavToolbar = memo(CanvasNavToolbarComponent);
