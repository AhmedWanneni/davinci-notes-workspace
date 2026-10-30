import React from "react";
import { Button } from "@app/design-system";
import { Plus, Minus, ArrowsIn } from "@phosphor-icons/react";

export interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  modeControl?: React.ReactNode;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  modeControl,
}) => {
  return (
    <div className="graph-view__controls">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onResetZoom}
        title="Reset zoom"
        aria-label="Reset zoom"
      >
        <ArrowsIn size={16} />
      </Button>
      {modeControl}
    </div>
  );
};
