import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import type { Node, OnNodeDrag } from "@xyflow/react";
import { CANVAS_SNAP_GRID, snapToGrid } from "./canvasConstants";
import { reparentNodesOnDrop } from "./groupContainment";
import { snapNodeToAlignment } from "./snapNodeAlignment";

export interface UseCanvasDragOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  persistCanvas: (
    nextNodes: Node[],
    nextEdges: import("@xyflow/react").Edge[],
  ) => void;
  edgesRef: React.MutableRefObject<import("@xyflow/react").Edge[]>;
}

export function useCanvasDrag({
  setNodes,
  persistCanvas,
  edgesRef,
}: UseCanvasDragOptions) {
  const dragStartPosRef = useRef<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const dragAxisLockRef = useRef<"x" | "y" | null>(null);

  const onNodeDragStart: OnNodeDrag = useCallback((_event, draggedNode) => {
    dragStartPosRef.current = {
      id: draggedNode.id,
      x: draggedNode.position.x,
      y: draggedNode.position.y,
    };
    dragAxisLockRef.current = null;
  }, []);

  const onNodeDrag: OnNodeDrag = useCallback(
    (event, draggedNode, draggedNodes) => {
      setNodes((current) => {
        const draggedIds = new Set(draggedNodes.map((n) => n.id));
        const others = current.filter((node) => !draggedIds.has(node.id));
        let targetX = draggedNode.position.x;
        let targetY = draggedNode.position.y;
        const e = event as MouseEvent;
        if (e.shiftKey && dragStartPosRef.current?.id === draggedNode.id) {
          const startX = dragStartPosRef.current.x;
          const startY = dragStartPosRef.current.y;
          if (!dragAxisLockRef.current) {
            const dx = Math.abs(targetX - startX);
            const dy = Math.abs(targetY - startY);
            if (dx > 5 || dy > 5) {
              dragAxisLockRef.current = dx > dy ? "x" : "y";
            }
          }
          if (dragAxisLockRef.current === "x") targetY = startY;
          else if (dragAxisLockRef.current === "y") targetX = startX;
        } else {
          dragAxisLockRef.current = null;
        }
        const aligned = snapNodeToAlignment(
          { ...draggedNode, position: { x: targetX, y: targetY } },
          others,
        );
        const dx = aligned.x - draggedNode.position.x;
        const dy = aligned.y - draggedNode.position.y;
        return current.map((node) => {
          if (!draggedIds.has(node.id)) return node;
          return {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy,
            },
          };
        });
      });
    },
    [setNodes],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, draggedNode, draggedNodes) => {
      dragStartPosRef.current = null;
      dragAxisLockRef.current = null;
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      setNodes((current) => {
        const draggedIds = new Set(draggedNodes.map((n) => n.id));
        const primary =
          current.find((n) => n.id === draggedNode.id) ?? draggedNodes[0];
        const snappedX = snapToGrid(primary.position.x, gridX);
        const snappedY = snapToGrid(primary.position.y, gridY);
        const dx = snappedX - primary.position.x;
        const dy = snappedY - primary.position.y;
        const next = current.map((node) => {
          if (!draggedIds.has(node.id)) return node;
          return {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy,
            },
          };
        });
        const reparented = reparentNodesOnDrop(next, Array.from(draggedIds));
        persistCanvas(reparented, edgesRef.current);
        return reparented;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  return { onNodeDragStart, onNodeDrag, onNodeDragStop };
}
