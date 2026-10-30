import {
  useCallback,
  useRef,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import {
  CANVAS_SNAP_GRID,
  DEFAULT_TEXT_CARD_HEIGHT,
  DEFAULT_TEXT_CARD_WIDTH,
  createTextCardId,
  snapToGrid,
} from "./canvasConstants";
import { useCanvasDrag } from "./useCanvasDrag";
import { useCanvasEdgeInteractions } from "./useCanvasEdgeInteractions";
import { useCanvasFileOps } from "./useCanvasFileOps";
import { useCanvasNodeChanges } from "./useCanvasNodeChanges";
import { useCanvasSelectionOps } from "./useCanvasSelectionOps";
import { useCanvasContextMenu } from "./useCanvasContextMenu";
import { useCanvasGroupOps } from "./useCanvasGroupOps";
import { isGroupNode, getTransitiveChildIds } from "./groupContainment";

export type { CanvasContextMenuState } from "./useCanvasContextMenu";

export interface UseCanvasInteractionsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
  onCreateNote?: (title: string, content?: string) => Promise<string>;
  onOpenFile?: (path: string) => void;
  allNotePaths?: readonly string[];
}

export function useCanvasInteractions({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
  onCreateNote,
  onOpenFile,
  allNotePaths = [],
}: UseCanvasInteractionsOptions) {
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const lastPaneClickRef = useRef(0);

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

  const groupOps = useCanvasGroupOps({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
  });

  const fileOps = useCanvasFileOps({
    setNodes,
    edgesRef,
    persistCanvas,
    onCreateNote,
  });

  const drag = useCanvasDrag({ setNodes, persistCanvas, edgesRef });

  const createTextCard = useCallback(
    (flowPosition: { x: number; y: number }) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const posX = Number.isFinite(flowPosition?.x) ? flowPosition.x : 0;
      const posY = Number.isFinite(flowPosition?.y) ? flowPosition.y : 0;
      const newNode: Node = {
        id: createTextCardId(),
        type: "text",
        position: {
          x: snapToGrid(posX, gridX),
          y: snapToGrid(posY, gridY),
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

  const getSelectedCount = useCallback(
    () => getNodes().filter((n) => n.selected).length,
    [getNodes],
  );

  const edgeInteractionsRef = useRef<ReturnType<
    typeof useCanvasEdgeInteractions
  > | null>(null);

  const contextMenuHooks = useCanvasContextMenu({
    onCreateTextCard: createTextCard,
    onCreateFileCard: (pos) => {
      const firstPath = allNotePaths[0] ?? "Untitled.md";
      fileOps.createFileCard(firstPath, pos);
    },
    onCreateEmptyGroup: groupOps.createEmptyGroup,
    onCreateGroupFromSelection: groupOps.createGroupFromSelection,
    deleteNode: nodeChanges.deleteNode,
    deleteGroup: groupOps.deleteGroupWithContents,
    deleteEdge: (id: string) => edgeInteractionsRef.current?.deleteEdge(id),
    setEditingEdgeId: (id: string) =>
      edgeInteractionsRef.current?.setEditingEdgeId(id),
    onEdgeColorChange: (id: string, color?) =>
      edgeInteractionsRef.current?.onEdgeColorChange(id, color),
    onNodeColorChange: groupOps.setNodeColor,
    onConvertTextToFile: fileOps.convertTextCardToFile,
    onOpenFile,
    getSelectedCount,
  });

  const edgeInteractions = useCanvasEdgeInteractions({
    setNodes,
    setEdges,
    edgesRef,
    persistCanvas,
    setContextMenu: contextMenuHooks.setContextMenu,
  });
  edgeInteractionsRef.current = edgeInteractions;

  const onPaneClick = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
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

  const deleteGroupAware = useCallback(
    (nodeId: string) => {
      const node = getNodes().find((n) => n.id === nodeId);
      if (node && isGroupNode(node)) {
        groupOps.deleteGroupWithContents(nodeId);
      } else {
        nodeChanges.deleteNode(nodeId);
      }
    },
    [getNodes, groupOps, nodeChanges],
  );

  const onNodesDeleteGroupAware = useCallback(
    (deleted: Node[]) => {
      const allIds = new Set<string>();
      for (const d of deleted) {
        allIds.add(d.id);
        for (const c of getTransitiveChildIds(getNodes(), [d.id])) {
          allIds.add(c);
        }
      }
      setEdges((current) => {
        const next = current.filter(
          (edge) => !allIds.has(edge.source) && !allIds.has(edge.target),
        );
        edgesRef.current = next;
        return next;
      });
    },
    [edgesRef, getNodes, setEdges],
  );

  return {
    ...selectionOps,
    ...groupOps,
    ...contextMenuHooks,
    createTextCardAtCenter,
    ...drag,
    onPaneClick,
    ...nodeChanges,
    deleteNode: deleteGroupAware,
    onNodesDelete: onNodesDeleteGroupAware,
    ...edgeInteractions,
    ...fileOps,
  };
}
