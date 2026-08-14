import type { JSX } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  AlignBottom,
  AlignCenterHorizontalSimple,
  AlignCenterVerticalSimple,
  AlignLeft,
  AlignRight,
  AlignTop,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  CornersOut,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  TextT,
} from "@phosphor-icons/react";
import type { AlignDirection, DistributeDirection } from "./arrangeNodes";
import styles from "./CanvasView.module.scss";

export interface CanvasControlsProps {
  onCreateTextCard: () => void;
  onAlign?: (direction: AlignDirection) => void;
  onDistribute?: (direction: DistributeDirection) => void;
}

type IconComponent = (props: { size?: number }) => JSX.Element | null;

export function CanvasControls({
  onCreateTextCard,
  onAlign,
  onDistribute,
}: CanvasControlsProps): JSX.Element {
  const { fitView, zoomIn, zoomOut, getNodes } = useReactFlow();
  const selectedCount = getNodes().filter((n) => n.selected).length;
  const canAlign = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;

  const alignBtn = (
    label: string,
    title: string,
    dir: AlignDirection,
    Icon: IconComponent,
  ): JSX.Element => (
    <button
      type="button"
      key={label}
      className={styles["canvas-controls__btn"]}
      onClick={() => onAlign?.(dir)}
      disabled={!canAlign}
      aria-label={label}
      title={canAlign ? title : `${title} — select 2+ cards`}
    >
      <Icon size={15} />
    </button>
  );

  const distributeBtn = (
    label: string,
    title: string,
    dir: DistributeDirection,
    Icon: IconComponent,
  ): JSX.Element => (
    <button
      type="button"
      key={label}
      className={styles["canvas-controls__btn"]}
      onClick={() => onDistribute?.(dir)}
      disabled={!canDistribute}
      aria-label={label}
      title={canDistribute ? title : `${title} — select 3+ cards`}
    >
      <Icon size={15} />
    </button>
  );

  return (
    <div
      className={styles["canvas-controls"]}
      aria-label="Canvas navigation controls"
    >
      <div
        className={styles["canvas-controls__group"]}
        role="group"
        aria-label="Create"
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
      </div>

      <div
        className={styles["canvas-controls__group"]}
        role="group"
        aria-label="Align selection"
      >
        {alignBtn(
          "Align Left",
          "Align Left",
          "left",
          AlignLeft as IconComponent,
        )}
        {alignBtn(
          "Align Center H",
          "Align Center (Horizontal)",
          "center-h",
          AlignCenterHorizontalSimple as IconComponent,
        )}
        {alignBtn(
          "Align Right",
          "Align Right",
          "right",
          AlignRight as IconComponent,
        )}
        {alignBtn("Align Top", "Align Top", "top", AlignTop as IconComponent)}
        {alignBtn(
          "Align Center V",
          "Align Center (Vertical)",
          "center-v",
          AlignCenterVerticalSimple as IconComponent,
        )}
        {alignBtn(
          "Align Bottom",
          "Align Bottom",
          "bottom",
          AlignBottom as IconComponent,
        )}
      </div>

      <div
        className={styles["canvas-controls__group"]}
        role="group"
        aria-label="Distribute selection"
      >
        {distributeBtn(
          "Distribute Horizontal",
          "Distribute Evenly (Horizontal)",
          "horizontal",
          ArrowsOutLineHorizontal as IconComponent,
        )}
        {distributeBtn(
          "Distribute Vertical",
          "Distribute Evenly (Vertical)",
          "vertical",
          ArrowsOutLineVertical as IconComponent,
        )}
      </div>

      <div
        className={styles["canvas-controls__group"]}
        role="group"
        aria-label="View"
      >
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
    </div>
  );
}
