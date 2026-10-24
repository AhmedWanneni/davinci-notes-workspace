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
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import {
  CANVAS_SNAP_GRID,
  MIN_TEXT_CARD_HEIGHT,
  MIN_TEXT_CARD_WIDTH,
  snapToGrid,
} from "./canvasConstants";
import { useCanvasEditor } from "./CanvasEditorContext";
import { CanvasCardActionBar } from "./CanvasCardActionBar";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import type { CanvasColor } from "./CanvasColor";
import styles from "./TextCardNode.module.scss";

export interface TextCardNodeData {
  text?: string;
  type?: "text";
  color?: string;
  [key: string]: unknown;
}

function TextCardNodeComponent({ id, data, selected }: NodeProps): JSX.Element {
  const { setNodes, fitView } = useReactFlow();
  const { onNodeTextChange, onLayoutChange, onDeleteNode, onNodeColorChange } =
    useCanvasEditor();
  const text = typeof data.text === "string" ? data.text : "";
  const color = typeof data.color === "string" ? data.color : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleZoomTo = useCallback(() => {
    void fitView({ nodes: [{ id }], duration: 300, padding: 0.3 });
  }, [fitView, id]);

  const handleDelete = useCallback(() => {
    onDeleteNode?.(id);
  }, [id, onDeleteNode]);

  const handleColorChange = useCallback(
    (nextColor?: string) => {
      onNodeColorChange?.(id, nextColor as CanvasColor);
    },
    [id, onNodeColorChange],
  );

  useEffect(() => {
    if (!isEditing) setDraft(text);
  }, [isEditing, text]);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, draggable: !isEditing } : node,
      ),
    );
  }, [id, isEditing, setNodes]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (draft !== text) onNodeTextChange(id, draft);
  }, [draft, id, onNodeTextChange, text]);

  const handleDoubleClick = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(text);
        setIsEditing(false);
      }
    },
    [text],
  );

  const handleResizeEnd = useCallback(
    (
      _event: unknown,
      params: { x: number; y: number; width: number; height: number },
    ) => {
      setNodes((nodes) => {
        const next = nodes.map((node) => {
          if (node.id !== id) return node;
          const width = Number.isFinite(params.width)
            ? params.width
            : typeof node.style?.width === "number"
              ? node.style.width
              : 250;
          const height = Number.isFinite(params.height)
            ? params.height
            : typeof node.style?.height === "number"
              ? node.style.height
              : 120;
          const posX = Number.isFinite(params.x) ? params.x : node.position.x;
          const posY = Number.isFinite(params.y) ? params.y : node.position.y;
          const [gridX, gridY] = CANVAS_SNAP_GRID;
          return {
            ...node,
            position: {
              x: snapToGrid(posX, gridX),
              y: snapToGrid(posY, gridY),
            },
            style: {
              ...node.style,
              width: snapToGrid(width, gridX),
              height: snapToGrid(height, gridY),
            },
          };
        });
        queueMicrotask(onLayoutChange);
        return next;
      });
    },
    [id, onLayoutChange, setNodes],
  );

  const cardClass = [
    styles["text-card"],
    selected ? styles["is-selected"] : "",
    isEditing ? styles["is-editing"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClass = [
    styles["text-card-wrapper"],
    selected ? styles["is-selected"] : "",
    isEditing ? styles["is-editing"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardBorderColor = color
    ? getCanvasEdgeColorCss(color as CanvasColor)
    : undefined;

  return (
    <div className={wrapperClass}>
      <CanvasCardActionBar
        selected={Boolean(selected && !isEditing)}
        onDelete={handleDelete}
        onColorChange={handleColorChange}
        onZoomTo={handleZoomTo}
        onEdit={() => setIsEditing(true)}
      />
      <NodeResizer
        isVisible={selected && !isEditing}
        minWidth={MIN_TEXT_CARD_WIDTH}
        minHeight={MIN_TEXT_CARD_HEIGHT}
        onResizeEnd={handleResizeEnd}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={styles["text-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles["text-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={styles["text-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={styles["text-card__handle"]}
      />
      <div
        className={cardClass}
        style={cardBorderColor ? { borderColor: cardBorderColor } : undefined}
        data-testid={`text-card-${id}`}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className={`${styles["text-card__textarea"]} nodrag nowheel nopan`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            aria-label="Edit text card"
          />
        ) : (
          <div
            className={`${styles["text-card__body"]} nopan`}
            onDoubleClick={handleDoubleClick}
          >
            {text ? (
              text
            ) : (
              <span className={styles["text-card__placeholder"]}>
                Double-click to edit
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const TextCardNode = memo(TextCardNodeComponent);
