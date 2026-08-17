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
  nodeType?: "text" | "file" | "group";
  nodeFile?: string;
  edgeId?: string;
  flowPosition?: { x: number; y: number };
  hasSelection?: boolean;
}

export interface UseCanvasContextMenuArgs {
  onCreateTextCard: (pos: { x: number; y: number }) => void;
  onCreateFileCard?: (pos: { x: number; y: number }) => void;
  onCreateEmptyGroup: (pos: { x: number; y: number }) => void;
  onCreateGroupFromSelection: () => void;
  deleteNode: (id: string) => void;
  deleteGroup: (id: string) => void;
  deleteEdge: (id: string) => void;
  setEditingEdgeId: (id: string) => void;
  onEdgeColorChange: (id: string, color?: CanvasColor) => void;
  onNodeColorChange: (id: string, color?: CanvasColor) => void;
  onConvertTextToFile?: (nodeId: string) => void;
  onOpenFile?: (filePath: string) => void;
  getSelectedCount: () => number;
}

export function useCanvasContextMenu({
  onCreateTextCard,
  onCreateFileCard,
  onCreateEmptyGroup,
  onCreateGroupFromSelection,
  deleteNode,
  deleteGroup,
  deleteEdge,
  setEditingEdgeId,
  onEdgeColorChange,
  onNodeColorChange,
  onConvertTextToFile,
  onOpenFile,
  getSelectedCount,
}: UseCanvasContextMenuArgs) {
  const { screenToFlowPosition, getNodes } = useReactFlow();
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
        hasSelection: getSelectedCount() > 0,
      });
    },
    [getSelectedCount, screenToFlowPosition],
  );

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent, node: Node) => {
      event.preventDefault();
      const nodeType = (node.type ??
        (node.data as { type?: string })?.type ??
        "text") as "text" | "file" | "group";
      const nodeFile = (node.data as { file?: string })?.file;

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType,
        nodeFile,
        hasSelection: getSelectedCount() > 0,
      });
    },
    [getSelectedCount, setContextMenu],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextCreateCard = useCallback(() => {
    if (contextMenu?.flowPosition) onCreateTextCard(contextMenu.flowPosition);
    setContextMenu(null);
  }, [contextMenu, onCreateTextCard]);

  const handleContextCreateFileCard = useCallback(() => {
    if (contextMenu?.flowPosition && onCreateFileCard) {
      onCreateFileCard(contextMenu.flowPosition);
    }
    setContextMenu(null);
  }, [contextMenu, onCreateFileCard]);

  const handleContextCreateEmptyGroup = useCallback(() => {
    if (contextMenu?.flowPosition) onCreateEmptyGroup(contextMenu.flowPosition);
    setContextMenu(null);
  }, [contextMenu, onCreateEmptyGroup]);

  const handleContextCreateGroupFromSelection = useCallback(() => {
    onCreateGroupFromSelection();
    setContextMenu(null);
  }, [onCreateGroupFromSelection]);

  const handleContextDeleteNode = useCallback(() => {
    if (!contextMenu?.nodeId) {
      setContextMenu(null);
      return;
    }
    const node = getNodes().find((n) => n.id === contextMenu.nodeId);
    const isGroup =
      node?.type === "group" ||
      (node?.data && (node.data as { type?: unknown }).type === "group");
    if (isGroup) {
      deleteGroup(contextMenu.nodeId);
    } else {
      deleteNode(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, deleteGroup, deleteNode, getNodes]);

  const handleContextConvertTextToFile = useCallback(() => {
    if (contextMenu?.nodeId && onConvertTextToFile) {
      onConvertTextToFile(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, onConvertTextToFile]);

  const handleContextOpenFile = useCallback(() => {
    if (contextMenu?.nodeFile && onOpenFile) {
      onOpenFile(contextMenu.nodeFile);
    }
    setContextMenu(null);
  }, [contextMenu, onOpenFile]);

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

  const handleContextSelectNodeColor = useCallback(
    (color?: CanvasColor) => {
      if (contextMenu?.nodeId) onNodeColorChange(contextMenu.nodeId, color);
      setContextMenu(null);
    },
    [contextMenu, onNodeColorChange],
  );

  return {
    contextMenu,
    setContextMenu,
    onPaneContextMenu,
    onNodeContextMenu,
    closeContextMenu,
    handleContextCreateCard,
    handleContextCreateFileCard,
    handleContextCreateEmptyGroup,
    handleContextCreateGroupFromSelection,
    handleContextDeleteNode,
    handleContextConvertTextToFile,
    handleContextOpenFile,
    handleContextDeleteEdge,
    handleContextEditEdgeLabel,
    handleContextSelectEdgeColor,
    handleContextSelectNodeColor,
  };
}
