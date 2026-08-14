import type { JSX } from "react";
import type { CanvasColor } from "./CanvasColor";
import { CANVAS_EDGE_PALETTE } from "./canvasEdgeConstants";
import type { CanvasContextMenuState } from "./useCanvasInteractions";
import styles from "./CanvasContextMenu.module.scss";

export interface CanvasContextMenuProps {
  menu: CanvasContextMenuState;
  onCreateTextCard: () => void;
  onDeleteNode: () => void;
  onDeleteEdge?: () => void;
  onEditEdgeLabel?: () => void;
  onSelectEdgeColor?: (color?: CanvasColor) => void;
  onClose: () => void;
}

export function CanvasContextMenu({
  menu,
  onCreateTextCard,
  onDeleteNode,
  onDeleteEdge,
  onEditEdgeLabel,
  onSelectEdgeColor,
  onClose,
}: CanvasContextMenuProps): JSX.Element {
  const isNodeMenu = Boolean(menu.nodeId);
  const isEdgeMenu = Boolean(menu.edgeId);

  return (
    <>
      <button
        type="button"
        className={styles["canvas-context-backdrop"]}
        aria-label="Close context menu"
        onClick={onClose}
      />
      <div
        className={styles["canvas-context-menu"]}
        style={{ top: menu.y, left: menu.x }}
        role="menu"
        data-testid="canvas-context-menu"
      >
        {isNodeMenu ? (
          <button
            type="button"
            className={styles["canvas-context-menu__item"]}
            role="menuitem"
            onClick={onDeleteNode}
            data-testid="context-menu-delete-node"
          >
            Delete card
          </button>
        ) : isEdgeMenu ? (
          <>
            <button
              type="button"
              className={styles["canvas-context-menu__item"]}
              role="menuitem"
              onClick={onEditEdgeLabel}
              data-testid="context-menu-edit-edge-label"
            >
              Edit label
            </button>
            <div className={styles["canvas-context-menu__divider"]} />
            <div className={styles["canvas-context-menu__section-title"]}>
              Color
            </div>
            <div
              className={styles["canvas-context-menu__color-row"]}
              data-testid="context-menu-edge-colors"
            >
              {CANVAS_EDGE_PALETTE.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={styles["canvas-context-menu__color-swatch"]}
                  style={{ backgroundColor: item.cssColor }}
                  title={item.label}
                  aria-label={`Set edge color to ${item.label}`}
                  onClick={() => onSelectEdgeColor?.(item.preset)}
                  data-testid={`edge-color-${item.preset ?? "default"}`}
                />
              ))}
            </div>
            <div className={styles["canvas-context-menu__divider"]} />
            <button
              type="button"
              className={styles["canvas-context-menu__item"]}
              role="menuitem"
              onClick={onDeleteEdge}
              data-testid="context-menu-delete-edge"
            >
              Delete connection
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles["canvas-context-menu__item"]}
            role="menuitem"
            onClick={onCreateTextCard}
            data-testid="context-menu-add-card"
          >
            Add text card
          </button>
        )}
      </div>
    </>
  );
}
