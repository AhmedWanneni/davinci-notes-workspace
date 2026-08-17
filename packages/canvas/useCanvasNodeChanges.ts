import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { reparentNodesOnDrop } from "./groupContainment";

export interface UseCanvasNodeChangesOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
}

function shouldPersistNodeChanges(changes: NodeChange[]): boolean {
  return changes.some(
    (change) =>
      change.type === "remove" ||
      change.type === "dimensions" ||
      change.type === "replace" ||
      (change.type === "position" &&
        "dragging" in change &&
        change.dragging === false),
  );
}

export function useCanvasNodeChanges({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
}: UseCanvasNodeChangesOptions) {
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => {
        const next = current.filter((node) => node.id !== nodeId);
        persistCanvas(next, edgesRef.current);
        return next;
      });
      setEdges((current) => {
        const next = current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        );
        edgesRef.current = next;
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onNodeTextChange = useCallback(
    (nodeId: string, text: string) => {
      setNodes((current) => {
        const next = current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, text, type: "text" } }
            : node,
        );
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removedIds = changes
        .filter((change) => change.type === "remove")
        .map((change) => change.id);
      const dropIds = changes
        .filter(
          (change): change is Extract<NodeChange, { type: "position" }> =>
            change.type === "position" &&
            "dragging" in change &&
            change.dragging === false,
        )
        .map((change) => change.id);

      setNodes((current) => {
        const applied = applyNodeChanges(changes, current);
        const next =
          dropIds.length > 0 ? reparentNodesOnDrop(applied, dropIds) : applied;
        if (!shouldPersistNodeChanges(changes)) return next;

        if (removedIds.length > 0) {
          setEdges((edgeList) => {
            const nextEdges = edgeList.filter(
              (edge) =>
                !removedIds.includes(edge.source) &&
                !removedIds.includes(edge.target),
            );
            edgesRef.current = nextEdges;
            queueMicrotask(() => persistCanvas(next, nextEdges));
            return nextEdges;
          });
        } else {
          queueMicrotask(() => persistCanvas(next, edgesRef.current));
        }

        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((current) => {
        const next = applyEdgeChanges(changes, current);
        edgesRef.current = next;
        if (changes.some((change) => change.type === "remove")) {
          setNodes((nodes) => {
            queueMicrotask(() => persistCanvas(nodes, next));
            return nodes;
          });
        }
        return next;
      });
    },
    [edgesRef, persistCanvas, setEdges, setNodes],
  );

  const onLayoutChange = useCallback(() => {
    setNodes((current) => {
      persistCanvas(current, edgesRef.current);
      return current;
    });
  }, [edgesRef, persistCanvas, setNodes]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((node) => node.id));
      setEdges((current) => {
        const next = current.filter(
          (edge) =>
            !deletedIds.has(edge.source) && !deletedIds.has(edge.target),
        );
        edgesRef.current = next;
        return next;
      });
    },
    [edgesRef, setEdges],
  );

  return {
    deleteNode,
    handleEdgesChange,
    handleNodesChange,
    onLayoutChange,
    onNodeTextChange,
    onNodesDelete,
  };
}
