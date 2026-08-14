import {
  useCallback,
  useRef,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import {
  useReactFlow,
  type Edge,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import {
  CANVAS_SNAP_GRID,
  DEFAULT_TEXT_CARD_HEIGHT,
  DEFAULT_TEXT_CARD_WIDTH,
  createTextCardId,
  snapToGrid,
} from "./canvasConstants";
import { snapNodeToAlignment } from "./snapNodeAlignment";
import { useCanvasEdgeInteractions } from "./useCanvasEdgeInteractions";
import { useCanvasNodeChanges } from "./useCanvasNodeChanges";
import { useCanvasSelectionOps } from "./useCanvasSelectionOps";
import { useCanvasContextMenu } from "./useCanvasContextMenu";

export type { CanvasContextMenuState } from "./useCanvasContextMenu";

export interface UseCanvasInteractionsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
}

export function useCanvasInteractions({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
}: UseCanvasInteractionsOptions) {
  const { screenToFlowPosition } = useReactFlow();
  const lastPaneClickRef = useRef(0);
  const dragStartPosRef = useRef<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const dragAxisLockRef = useRef<"x" | "y" | null>(null);

  const nodeChanges = useCanvasNodeChanges({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
  });

  const selectionOps = useCanvasSelectionOps({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
  });

  const createTextCard = useCallback(
    (flowPosition: { x: number; y: number }) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const newNode: Node = {
        id: createTextCardId(),
        type: "text",
        position: {
          x: snapToGrid(flowPosition.x, gridX),
          y: snapToGrid(flowPosition.y, gridY),
        },
        style: {
          width: DEFAULT_TEXT_CARD_WIDTH,
          height: DEFAULT_TEXT_CARD_HEIGHT,
        },
        data: { type: "text", text: "" },
      };
      setNodes((current) => {
        const next = [...current, newNode];
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const contextMenuHooks = useCanvasContextMenu({
    onCreateTextCard: createTextCard,
    deleteNode: nodeChanges.deleteNode,
    deleteEdge: (id: string) => edgeInteractionsRef.current?.deleteEdge(id),
    setEditingEdgeId: (id: string) =>
      edgeInteractionsRef.current?.setEditingEdgeId(id),
    onEdgeColorChange: (id: string, color?) =>
      edgeInteractionsRef.current?.onEdgeColorChange(id, color),
  });

  const edgeInteractionsRef = useRef<ReturnType<
    typeof useCanvasEdgeInteractions
  > | null>(null);

  const edgeInteractions = useCanvasEdgeInteractions({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
    setContextMenu: contextMenuHooks.setContextMenu,
  });
  edgeInteractionsRef.current = edgeInteractions;

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
        const snappedX = snapToGrid(draggedNode.position.x, gridX);
        const snappedY = snapToGrid(draggedNode.position.y, gridY);
        const dx = snappedX - draggedNode.position.x;
        const dy = snappedY - draggedNode.position.y;
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
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const onPaneClick = useCallback(
    (event: ReactMouseEvent) => {
      contextMenuHooks.closeContextMenu();
      const now = Date.now();
      if (now - lastPaneClickRef.current < 300) {
        lastPaneClickRef.current = 0;
        createTextCard(
          screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        );
        return;
      }
      lastPaneClickRef.current = now;
    },
    [contextMenuHooks, createTextCard, screenToFlowPosition],
  );

  const createTextCardAtCenter = useCallback(() => {
    createTextCard(
      screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
    );
  }, [createTextCard, screenToFlowPosition]);

  return {
    ...selectionOps,
    ...contextMenuHooks,
    createTextCardAtCenter,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onPaneClick,
    ...nodeChanges,
    ...edgeInteractions,
  };
}
