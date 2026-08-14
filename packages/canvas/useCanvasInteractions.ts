import {
  useCallback,
  useRef,
  useState,
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
import type { CanvasColor } from "./CanvasColor";
import {
  CANVAS_SNAP_GRID,
  createTextCardId,
  DEFAULT_TEXT_CARD_HEIGHT,
  DEFAULT_TEXT_CARD_WIDTH,
  snapToGrid,
} from "./canvasConstants";
import { snapNodeToAlignment } from "./snapNodeAlignment";
import { useCanvasEdgeInteractions } from "./useCanvasEdgeInteractions";
import { useCanvasNodeChanges } from "./useCanvasNodeChanges";

export interface CanvasContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  flowPosition?: { x: number; y: number };
}

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
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(
    null,
  );

  const nodeChanges = useCanvasNodeChanges({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
  });

  const edgeInteractions = useCanvasEdgeInteractions({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
    setContextMenu,
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

  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, draggedNode) => {
      setNodes((current) => {
        const others = current.filter((node) => node.id !== draggedNode.id);
        const aligned = snapNodeToAlignment(draggedNode, others);
        return current.map((node) =>
          node.id === draggedNode.id ? { ...node, position: aligned } : node,
        );
      });
    },
    [setNodes],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, draggedNode) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      setNodes((current) => {
        const next = current.map((node) => {
          if (node.id !== draggedNode.id) return node;
          return {
            ...node,
            position: {
              x: snapToGrid(node.position.x, gridX),
              y: snapToGrid(node.position.y, gridY),
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
      setContextMenu(null);
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
    [createTextCard, screenToFlowPosition],
  );

  const onPaneContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [screenToFlowPosition],
  );

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextCreate = useCallback(() => {
    if (contextMenu?.flowPosition) createTextCard(contextMenu.flowPosition);
    setContextMenu(null);
  }, [contextMenu, createTextCard]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu?.nodeId) nodeChanges.deleteNode(contextMenu.nodeId);
    setContextMenu(null);
  }, [contextMenu, nodeChanges]);

  const handleContextDeleteEdge = useCallback(() => {
    if (contextMenu?.edgeId) edgeInteractions.deleteEdge(contextMenu.edgeId);
    setContextMenu(null);
  }, [contextMenu, edgeInteractions]);

  const handleContextEditEdgeLabel = useCallback(() => {
    if (contextMenu?.edgeId) {
      edgeInteractions.setEditingEdgeId(contextMenu.edgeId);
    }
    setContextMenu(null);
  }, [contextMenu, edgeInteractions]);

  const handleContextSelectEdgeColor = useCallback(
    (color?: CanvasColor) => {
      if (contextMenu?.edgeId) {
        edgeInteractions.onEdgeColorChange(contextMenu.edgeId, color);
      }
      setContextMenu(null);
    },
    [contextMenu, edgeInteractions],
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
    contextMenu,
    closeContextMenu,
    createTextCardAtCenter,
    handleContextCreate,
    handleContextDelete,
    handleContextDeleteEdge,
    handleContextEditEdgeLabel,
    handleContextSelectEdgeColor,
    onNodeDrag,
    onNodeDragStop,
    onNodeContextMenu,
    onPaneClick,
    onPaneContextMenu,
    ...nodeChanges,
    ...edgeInteractions,
  };
}
