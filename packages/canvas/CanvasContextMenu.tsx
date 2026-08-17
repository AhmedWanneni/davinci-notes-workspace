import type { JSX } from "react";
import type { CanvasColor } from "./CanvasColor";
import { CANVAS_EDGE_PALETTE } from "./canvasEdgeConstants";
import type { CanvasContextMenuState } from "./useCanvasContextMenu";
import styles from "./CanvasContextMenu.module.scss";

export interface CanvasContextMenuProps {
  menu: CanvasContextMenuState;
  onCreateTextCard: () => void;
  onCreateFileCard?: () => void;
  onCreateEmptyGroup: () => void;
  onCreateGroupFromSelection: () => void;
  onDeleteNode: (nodeId: string) => void;
  onConvertTextToFile?: () => void;
  onOpenFile?: () => void;
  onDeleteEdge?: () => void;
  onEditEdgeLabel?: () => void;
  onSelectEdgeColor?: (color?: CanvasColor) => void;
  onSelectNodeColor?: (color?: CanvasColor) => void;
  onClose: () => void;
}

function ColorSwatchRow({
  onSelect,
  testPrefix,
}: {
  onSelect: (color?: CanvasColor) => void;
  testPrefix: string;
}) {
  return (
    <div className={styles["canvas-context-menu__color-row"]}>
      {CANVAS_EDGE_PALETTE.map((item) => (
        <button
          key={item.label}
          type="button"
          className={styles["canvas-context-menu__color-swatch"]}
          style={{ backgroundColor: item.cssColor }}
          title={item.label}
          aria-label={`Set color to ${item.label}`}
          onClick={() => onSelect(item.preset)}
          data-testid={`${testPrefix}-color-${item.preset ?? "default"}`}
        />
      ))}
    </div>
  );
}

export function CanvasContextMenu({
  menu,
  onCreateTextCard,
  onCreateFileCard,
  onCreateEmptyGroup,
  onCreateGroupFromSelection,
  onDeleteNode,
  onConvertTextToFile,
  onOpenFile,
  onDeleteEdge,
  onEditEdgeLabel,
  onSelectEdgeColor,
  onSelectNodeColor,
  onClose,
}: CanvasContextMenuProps): JSX.Element {
  const isNodeMenu = Boolean(menu.nodeId);
  const isEdgeMenu = Boolean(menu.edgeId);
  const hasSelection = Boolean(menu.hasSelection);
  const isTextNode = menu.nodeType === "text";
  const isFileNode = menu.nodeType === "file";

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
          <>
            <div className={styles["canvas-context-menu__section-title"]}>
              Color
            </div>
            <ColorSwatchRow
              onSelect={onSelectNodeColor ?? (() => {})}
              testPrefix="node"
            />
            <div className={styles["canvas-context-menu__divider"]} />
            {isTextNode && onConvertTextToFile && (
              <button
                type="button"
                className={styles["canvas-context-menu__item"]}
                role="menuitem"
                onClick={onConvertTextToFile}
                data-testid="context-menu-convert-text-to-file"
              >
                Convert to note
              </button>
            )}
            {isFileNode && onOpenFile && (
              <button
                type="button"
                className={styles["canvas-context-menu__item"]}
                role="menuitem"
                onClick={onOpenFile}
                data-testid="context-menu-open-file"
              >
                Open note in editor
              </button>
            )}
            <button
              type="button"
              className={styles["canvas-context-menu__item"]}
              role="menuitem"
              onClick={() => menu.nodeId && onDeleteNode(menu.nodeId)}
              data-testid="context-menu-delete-node"
            >
              Delete card
            </button>
          </>
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
            <ColorSwatchRow
              onSelect={onSelectEdgeColor ?? (() => {})}
              testPrefix="edge"
            />
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
          <>
            <button
              type="button"
              className={styles["canvas-context-menu__item"]}
              role="menuitem"
              onClick={onCreateTextCard}
              data-testid="context-menu-add-card"
            >
              Add text card
            </button>
            {onCreateFileCard && (
              <button
                type="button"
                className={styles["canvas-context-menu__item"]}
                role="menuitem"
                onClick={onCreateFileCard}
                data-testid="context-menu-add-file-card"
              >
                Add note embed
              </button>
            )}
            <button
              type="button"
              className={styles["canvas-context-menu__item"]}
              role="menuitem"
              onClick={onCreateEmptyGroup}
              data-testid="context-menu-add-empty-group"
            >
              Add group
            </button>
            {hasSelection && (
              <>
                <div className={styles["canvas-context-menu__divider"]} />
                <button
                  type="button"
                  className={styles["canvas-context-menu__item"]}
                  role="menuitem"
                  onClick={onCreateGroupFromSelection}
                  data-testid="context-menu-group-selection"
                >
                  Group selection
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
