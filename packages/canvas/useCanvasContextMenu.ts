import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import type { CanvasColor } from "./CanvasColor";

export interface CanvasContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  flowPosition?: { x: number; y: number };
}

export interface UseCanvasContextMenuArgs {
  onCreateTextCard: (pos: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setEditingEdgeId: (id: string) => void;
  onEdgeColorChange: (id: string, color?: CanvasColor) => void;
}

export function useCanvasContextMenu({
  onCreateTextCard,
  deleteNode,
  deleteEdge,
  setEditingEdgeId,
  onEdgeColorChange,
}: UseCanvasContextMenuArgs) {
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(
    null,
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
    if (contextMenu?.flowPosition) onCreateTextCard(contextMenu.flowPosition);
    setContextMenu(null);
  }, [contextMenu, onCreateTextCard]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu?.nodeId) deleteNode(contextMenu.nodeId);
    setContextMenu(null);
  }, [contextMenu, deleteNode]);

  const handleContextDeleteEdge = useCallback(() => {
    if (contextMenu?.edgeId) deleteEdge(contextMenu.edgeId);
    setContextMenu(null);
  }, [contextMenu, deleteEdge]);

  const handleContextEditEdgeLabel = useCallback(() => {
    if (contextMenu?.edgeId) setEditingEdgeId(contextMenu.edgeId);
    setContextMenu(null);
  }, [contextMenu, setEditingEdgeId]);

  const handleContextSelectEdgeColor = useCallback(
    (color?: CanvasColor) => {
      if (contextMenu?.edgeId) onEdgeColorChange(contextMenu.edgeId, color);
      setContextMenu(null);
    },
    [contextMenu, onEdgeColorChange],
  );

  return {
    contextMenu,
    setContextMenu,
    onPaneContextMenu,
    onNodeContextMenu,
    closeContextMenu,
    handleContextCreate,
    handleContextDelete,
    handleContextDeleteEdge,
    handleContextEditEdgeLabel,
    handleContextSelectEdgeColor,
  };
}
