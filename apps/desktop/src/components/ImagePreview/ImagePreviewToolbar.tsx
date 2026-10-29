import React from "react";
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutSimple,
  X,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
import styles from "./ImagePreview.module.scss";

export interface ImagePreviewToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClose?: () => void;
}

export function ImagePreviewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onClose,
}: ImagePreviewToolbarProps) {
  const percentage = Math.round(zoom * 100);

  return (
    <div
      className={styles["toolbar"]}
      role="toolbar"
      aria-label="Image Preview Controls"
    >
      <Tooltip content="Zoom out" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles["toolbar-btn"]}
          onClick={onZoomOut}
          aria-label="Zoom out"
          disabled={zoom <= 0.2}
        >
          <MagnifyingGlassMinus size={15} />
        </button>
      </Tooltip>

      <span className={styles["zoom-indicator"]} aria-live="polite">
        {percentage}%
      </span>

      <Tooltip content="Zoom in" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles["toolbar-btn"]}
          onClick={onZoomIn}
          aria-label="Zoom in"
          disabled={zoom >= 5.0}
        >
          <MagnifyingGlassPlus size={15} />
        </button>
      </Tooltip>

      <Tooltip content="Reset zoom (100%)" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles["toolbar-btn"]}
          onClick={onResetZoom}
          aria-label="Reset zoom"
        >
          <ArrowsOutSimple size={15} />
        </button>
      </Tooltip>

      {onClose && (
        <Tooltip content="Close preview" contentProps={{ side: "bottom" }}>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={15} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
