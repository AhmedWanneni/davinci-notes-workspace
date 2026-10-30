import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react";
import { CANVAS_SNAP_GRID, snapToGrid } from "./canvasConstants";
import { useCanvasEditor } from "./CanvasEditorContext";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import styles from "./GroupCardNode.module.scss";

const MIN_GROUP_WIDTH = 120;
const MIN_GROUP_HEIGHT = 96;

export interface GroupCardNodeData {
  label?: string;
  type?: "group";
  color?: string;
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
  [key: string]: unknown;
}

function GroupCardNodeComponent({
  id,
  data,
  selected,
}: NodeProps): JSX.Element {
  const { setNodes } = useReactFlow();
  const { onLayoutChange } = useCanvasEditor();
  const label = typeof data.label === "string" ? data.label : "";
  const color = typeof data.color === "string" ? data.color : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(label);
  }, [isEditing, label]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (draft !== label) {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, label: draft, type: "group" } }
            : n,
        ),
      );
      queueMicrotask(onLayoutChange);
    }
  }, [draft, id, label, onLayoutChange, setNodes]);

  const handleDoubleClick = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitEdit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setDraft(label);
        setIsEditing(false);
      }
    },
    [commitEdit, label],
  );

  const handleResizeEnd = useCallback(
    (_event: unknown, p: { x: number; y: number; width: number; height: number }) => {
      setNodes((nodes) => {
        const next = nodes.map((node) => {
          if (node.id !== id) return node;
          const w = Number.isFinite(p.width)
            ? p.width
            : typeof node.style?.width === "number"
              ? node.style.width
              : 360;
          const h = Number.isFinite(p.height)
            ? p.height
            : typeof node.style?.height === "number"
              ? node.style.height
              : 264;
          const posX = Number.isFinite(p.x) ? p.x : node.position.x;
          const posY = Number.isFinite(p.y) ? p.y : node.position.y;
          const [gx, gy] = CANVAS_SNAP_GRID;
          return {
            ...node,
            position: { x: snapToGrid(posX, gx), y: snapToGrid(posY, gy) },
            style: {
              ...node.style,
              width: snapToGrid(w, gx),
              height: snapToGrid(h, gy),
            },
          };
        });
        queueMicrotask(onLayoutChange);
        return next;
      });
    },
    [id, onLayoutChange, setNodes],
  );

  const accentColor = getCanvasEdgeColorCss(color);

  const wrapperClass = [
    styles["group-card-wrapper"],
    selected ? styles["is-selected"] : "",
    isEditing ? styles["is-editing"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardClass = [
    styles["group-card"],
    selected ? styles["is-selected"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <NodeResizer
        isVisible={selected && !isEditing}
        minWidth={MIN_GROUP_WIDTH}
        minHeight={MIN_GROUP_HEIGHT}
        onResizeEnd={handleResizeEnd}
      />
      <div
        className={cardClass}
        data-testid={`group-card-${id}`}
        style={{ borderColor: accentColor }}
      >
        <div
          className={styles["group-card__label-bar"]}
          style={{ borderColor: accentColor }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className={`${styles["group-card__label-input"]} nodrag nowheel nopan`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              aria-label="Edit group label"
            />
          ) : (
            <span
              className={`${styles["group-card__label"]} nopan`}
              style={{ color: accentColor }}
              onDoubleClick={handleDoubleClick}
            >
              {label || "Untitled Group"}
            </span>
          )}
        </div>
        <div className={styles["group-card__body"]} />
      </div>
    </div>
  );
}

export const GroupCardNode = memo(GroupCardNodeComponent);
