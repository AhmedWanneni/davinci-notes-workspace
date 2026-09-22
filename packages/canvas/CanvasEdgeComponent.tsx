import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasColor } from "./CanvasColor";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import { useCanvasEditor } from "./CanvasEditorContext";
import styles from "./CanvasEdgeComponent.module.scss";

export interface CanvasEdgeData {
  fromSide?: "top" | "right" | "bottom" | "left";
  fromEnd?: "none" | "arrow";
  toSide?: "top" | "right" | "bottom" | "left";
  toEnd?: "none" | "arrow";
  color?: CanvasColor;
  label?: string;
  [key: string]: unknown;
}

function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected,
  label,
}: EdgeProps): JSX.Element {
  const { onEdgeLabelChange, editingEdgeId, setEditingEdgeId } =
    useCanvasEditor();

  const edgeData = (data ?? {}) as CanvasEdgeData;
  const currentLabel =
    typeof label === "string"
      ? label
      : typeof edgeData.label === "string"
        ? edgeData.label
        : "";

  const isEditing = editingEdgeId === id;
  const [draftLabel, setDraftLabel] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraftLabel(currentLabel);
      inputRef.current?.focus();
      if (typeof inputRef.current?.select === "function") {
        inputRef.current.select();
      }
    }
  }, [currentLabel, isEditing]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const commitEdit = useCallback(() => {
    setEditingEdgeId?.(null);
    if (draftLabel !== currentLabel) {
      onEdgeLabelChange?.(id, draftLabel);
    }
  }, [currentLabel, draftLabel, id, onEdgeLabelChange, setEditingEdgeId]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitEdit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setDraftLabel(currentLabel);
        setEditingEdgeId?.(null);
      }
    },
    [commitEdit, currentLabel, setEditingEdgeId],
  );

  const handleLabelDoubleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setEditingEdgeId?.(id);
    },
    [id, setEditingEdgeId],
  );

  const edgeColor = getCanvasEdgeColorCss(edgeData.color);
  const edgeStyle: CSSProperties = { ...style };

  const edgeClassName = [
    styles["canvas-edge"],
    selected ? styles["is-selected"] : "",
    isEditing ? styles["is-editing"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <g className={edgeClassName} style={edgeStyle} data-testid={`edge-${id}`}>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          markerStart={markerStart}
          style={{ stroke: edgeColor }}
          className={styles["canvas-edge__path"]}
        />
        <path
          d={edgePath}
          className={styles["canvas-edge__interaction-path"]}
          onDoubleClick={handleLabelDoubleClick}
        />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className={`${styles["canvas-edge__label-wrapper"]} nodrag nopan`}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className={styles["canvas-edge__input"]}
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              aria-label="Edit edge label"
              data-testid={`edge-label-input-${id}`}
            />
          ) : currentLabel ? (
            <div
              className={styles["canvas-edge__label-tag"]}
              style={{ borderColor: edgeColor }}
              onDoubleClick={handleLabelDoubleClick}
              data-testid={`edge-label-${id}`}
            >
              {currentLabel}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CanvasEdgeComponent = memo(CanvasEdgeRenderer);
