import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Edge, Node } from "@xyflow/react";
import {
  CANVAS_SNAP_GRID,
  DEFAULT_GROUP_HEIGHT,
  DEFAULT_GROUP_WIDTH,
  createGroupId,
  snapToGrid,
} from "./canvasConstants";
import {
  computeGroupBboxForIds,
  expandSelectionToMembers,
  getTransitiveChildIds,
  isGroupNode,
  reparentNodesOnDrop,
  wouldCreateCycle,
  getNodeDepth,
  MAX_GROUP_NESTING_DEPTH,
} from "./groupContainment";
import type { CanvasColor } from "./CanvasColor";

export interface UseCanvasGroupOpsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
}

export function useCanvasGroupOps({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
}: UseCanvasGroupOpsOptions) {
  const createGroupFromSelection = useCallback(() => {
    setNodes((current) => {
      const selectedIds = current.filter((n) => n.selected).map((n) => n.id);
      const childIds = expandSelectionToMembers(current, selectedIds);
      const bbox = computeGroupBboxForIds(current, childIds);
      if (!bbox) return current;

      const groupId = createGroupId();
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const newGroup: Node = {
        id: groupId,
        type: "group",
        position: {
          x: snapToGrid(bbox.x, gridX),
          y: snapToGrid(bbox.y, gridY),
        },
        style: {
          width: snapToGrid(bbox.width, gridX),
          height: snapToGrid(bbox.height, gridY),
        },
        data: { type: "group", label: "" },
      };

      const childSet = new Set(childIds);
      const next: Node[] = current
        .map((n) => (n.selected ? { ...n, selected: false } : n))
        .map((n) => {
          if (!childSet.has(n.id)) return n;
          const childDepth = getNodeDepth(current, n.id);
          if (childDepth >= MAX_GROUP_NESTING_DEPTH - 1) return n;
          if (wouldCreateCycle(current, n.id, groupId)) return n;
          const parentAbs = newGroup.position;
          const absX = n.position.x;
          const absY = n.position.y;
          const updated: Node = {
            ...n,
            parentId: groupId,
            position: { x: absX - parentAbs.x, y: absY - parentAbs.y },
            extent: "parent",
          };
          return updated;
        })
        .concat([{ ...newGroup, selected: true }]);
      const withParent = reparentNodesOnDrop(next, [groupId]);

      queueMicrotask(() => persistCanvas(withParent, edgesRef.current));
      return withParent;
    });
  }, [edgesRef, persistCanvas, setNodes]);

  const createEmptyGroup = useCallback(
    (flowPos: { x: number; y: number }) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const groupId = createGroupId();
      const newGroup: Node = {
        id: groupId,
        type: "group",
        position: {
          x: snapToGrid(flowPos.x, gridX),
          y: snapToGrid(flowPos.y, gridY),
        },
        style: {
          width: DEFAULT_GROUP_WIDTH,
          height: DEFAULT_GROUP_HEIGHT,
        },
        data: { type: "group", label: "" },
      };
      setNodes((current) => {
        const next = current
          .map((n) => ({ ...n, selected: false }))
          .concat([{ ...newGroup, selected: true }]);
        const withParent = reparentNodesOnDrop(next, [groupId]);
        queueMicrotask(() => persistCanvas(withParent, edgesRef.current));
        return withParent;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const deleteGroupWithContents = useCallback(
    (groupId: string) => {
      setNodes((current) => {
        const toDelete = new Set<string>([groupId]);
        for (const id of getTransitiveChildIds(current, [groupId])) {
          toDelete.add(id);
        }
        const next = current.filter((n) => !toDelete.has(n.id));
        setEdges((edgeList) => {
          const nextEdges = edgeList.filter(
            (e) => !toDelete.has(e.source) && !toDelete.has(e.target),
          );
          edgesRef.current = nextEdges;
          queueMicrotask(() => persistCanvas(next, nextEdges));
          return nextEdges;
        });
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const setNodeColor = useCallback(
    (nodeId: string, color?: CanvasColor) => {
      setNodes((current) => {
        const next = current.map((n) => {
          if (n.id !== nodeId) return n;
          const isGroup = isGroupNode(n);
          const dataType = isGroup
            ? "group"
            : ((n.data?.type as string) ?? "text");
          const data: Record<string, unknown> = { ...n.data, type: dataType };
          if (color) data.color = color;
          else delete data.color;
          return { ...n, data };
        });
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  return {
    createEmptyGroup,
    createGroupFromSelection,
    deleteGroupWithContents,
    setNodeColor,
  };
}
