import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import {
  MarkerType,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { CanvasColor } from "./CanvasColor";
import {
  createCanvasEdgeId,
  getCanvasEdgeColorCss,
} from "./canvasEdgeConstants";
import type { CanvasContextMenuState } from "./useCanvasContextMenu";

export interface UseCanvasEdgeInteractionsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
  setContextMenu: Dispatch<SetStateAction<CanvasContextMenuState | null>>;
}

export function useCanvasEdgeInteractions({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
  setContextMenu,
}: UseCanvasEdgeInteractionsOptions) {
  const reconnectSuccessfulRef = useRef(true);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const edgeColor = getCanvasEdgeColorCss();
      const newEdge: Edge = {
        id: createCanvasEdgeId(),
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        },
        data: {
          fromSide: connection.sourceHandle,
          toSide: connection.targetHandle,
          toEnd: "arrow",
          fromEnd: "none",
        },
      };

      setEdges((current) => {
        const next = [...current, newEdge];
        edgesRef.current = next;
        setNodes((nodes) => {
          queueMicrotask(() => persistCanvas(nodes, next));
          return nodes;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onReconnectStart = useCallback(() => {
    reconnectSuccessfulRef.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      reconnectSuccessfulRef.current = true;
      setEdges((current) => {
        const updated = reconnectEdge(oldEdge, newConnection, current);
        const next = updated.map((edge) => {
          if (edge.id !== oldEdge.id) return edge;
          const prevData = (edge.data ?? {}) as Record<string, unknown>;
          return {
            ...edge,
            sourceHandle: newConnection.sourceHandle,
            targetHandle: newConnection.targetHandle,
            data: {
              ...prevData,
              fromSide: newConnection.sourceHandle,
              toSide: newConnection.targetHandle,
            },
          };
        });
        edgesRef.current = next;
        setNodes((nodes) => {
          queueMicrotask(() => persistCanvas(nodes, next));
          return nodes;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge) => {
      if (!reconnectSuccessfulRef.current) {
        setEdges((current) => {
          const next = current.filter((e) => e.id !== edge.id);
          edgesRef.current = next;
          setNodes((nodes) => {
            queueMicrotask(() => persistCanvas(nodes, next));
            return nodes;
          });
          return next;
        });
      }
      reconnectSuccessfulRef.current = true;
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    [setContextMenu],
  );

  const onEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      setEdges((current) => {
        const next = current.map((edge) => {
          if (edge.id !== edgeId) return edge;
          const prevData = (edge.data ?? {}) as Record<string, unknown>;
          return {
            ...edge,
            label,
            data: { ...prevData, label },
          };
        });
        edgesRef.current = next;
        setNodes((nodes) => {
          queueMicrotask(() => persistCanvas(nodes, next));
          return nodes;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onEdgeColorChange = useCallback(
    (edgeId: string, color?: CanvasColor) => {
      const edgeColor = getCanvasEdgeColorCss(color);
      setEdges((current) => {
        const next = current.map((edge) => {
          if (edge.id !== edgeId) return edge;
          const prevData = (edge.data ?? {}) as Record<string, unknown>;
          const hasArrowEnd = prevData.toEnd !== "none";
          const hasArrowStart = prevData.fromEnd === "arrow";

          return {
            ...edge,
            markerEnd: hasArrowEnd
              ? {
                  type: MarkerType.ArrowClosed,
                  color: edgeColor,
                  width: 14,
                  height: 14,
                }
              : undefined,
            markerStart: hasArrowStart
              ? {
                  type: MarkerType.ArrowClosed,
                  color: edgeColor,
                  width: 14,
                  height: 14,
                }
              : undefined,
            data: {
              ...prevData,
              color,
            },
          };
        });
        edgesRef.current = next;
        setNodes((nodes) => {
          queueMicrotask(() => persistCanvas(nodes, next));
          return nodes;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((current) => {
        const next = current.filter((edge) => edge.id !== edgeId);
        edgesRef.current = next;
        setNodes((nodes) => {
          queueMicrotask(() => persistCanvas(nodes, next));
          return nodes;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  return {
    editingEdgeId,
    setEditingEdgeId,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onEdgeContextMenu,
    onEdgeLabelChange,
    onEdgeColorChange,
    deleteEdge,
  };
}
