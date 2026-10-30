import { memo, useCallback, useState, type JSX, type MouseEvent } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import {
  CornersOut,
  Palette,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { CANVAS_COLOR_PRESETS } from "./CanvasColor";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import styles from "./CanvasCardActionBar.module.scss";

export interface CanvasCardActionBarProps {
  selected: boolean;
  onDelete: () => void;
  onColorChange: (color?: string) => void;
  onZoomTo: () => void;
  onEdit?: () => void;
}

function CanvasCardActionBarComponent({
  selected,
  onDelete,
  onColorChange,
  onZoomTo,
  onEdit,
}: CanvasCardActionBarProps): JSX.Element | null {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toggleColors = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker((v) => !v);
  }, []);

  const selectColor = useCallback(
    (color?: string) => {
      onColorChange(color);
      setShowColorPicker(false);
    },
    [onColorChange],
  );

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Top}
      offset={8}
      className={styles["card-action-bar"]}
    >
      <button
        type="button"
        className={styles["action-btn"]}
        onClick={onDelete}
        title="Delete card"
        aria-label="Delete card"
      >
        <TrashSimple size={14} />
      </button>

      <button
        type="button"
        className={styles["action-btn"]}
        onClick={toggleColors}
        title="Change color"
        aria-label="Change color"
      >
        <Palette size={14} />
      </button>

      <button
        type="button"
        className={styles["action-btn"]}
        onClick={onZoomTo}
        title="Zoom to card"
        aria-label="Zoom to card"
      >
        <CornersOut size={14} />
      </button>

      {onEdit && (
        <button
          type="button"
          className={styles["action-btn"]}
          onClick={onEdit}
          title="Edit card"
          aria-label="Edit card"
        >
          <PencilSimple size={14} />
        </button>
      )}

      {showColorPicker && (
        <div className={styles["color-popover"]}>
          <button
            type="button"
            className={`${styles["color-swatch"]} ${styles["is-none"]}`}
            onClick={() => selectColor(undefined)}
            title="Default color"
            aria-label="Default color"
          />
          {CANVAS_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles["color-swatch"]}
              style={{ backgroundColor: getCanvasEdgeColorCss(preset) }}
              onClick={() => selectColor(preset)}
              title={`Color ${preset}`}
              aria-label={`Color ${preset}`}
            />
          ))}
        </div>
      )}
    </NodeToolbar>
  );
}

export const CanvasCardActionBar = memo(CanvasCardActionBarComponent);
