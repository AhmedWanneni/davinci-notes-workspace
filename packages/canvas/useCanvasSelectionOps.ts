import {
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Edge, Node } from "@xyflow/react";
import { createTextCardId } from "./canvasConstants";
import {
  alignNodes,
  distributeNodes,
  type AlignDirection,
  type DistributeDirection,
} from "./arrangeNodes";
import { expandSelectionToMembers } from "./groupContainment";

export interface UseCanvasSelectionOpsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  edgesRef: React.MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
}

export function useCanvasSelectionOps({
  setNodes,
  setEdges,
  edgesRef,
  persistCanvas,
}: UseCanvasSelectionOpsOptions) {
  const duplicateSelection = useCallback(() => {
    setNodes((currentNodes) => {
      const initiallySelected = currentNodes
        .filter((n) => n.selected)
        .map((n) => n.id);
      const expandedIds = new Set(
        expandSelectionToMembers(currentNodes, initiallySelected),
      );
      const selectedNodes = currentNodes.filter((n) => expandedIds.has(n.id));
      if (selectedNodes.length === 0) return currentNodes;

      const idMap = new Map<string, string>();
      const newNodes = selectedNodes.map((node) => {
        const newId = createTextCardId();
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          selected: true,
          parentId: node.parentId
            ? (idMap.get(node.parentId) ?? undefined)
            : undefined,
          position: {
            x: node.position.x + 48,
            y: node.position.y + 48,
          },
        };
      });

      const nextNodes = currentNodes
        .map((n) => (n.selected ? { ...n, selected: false } : n))
        .concat(newNodes);

      setEdges((currentEdges) => {
        const newEdges: Edge[] = [];
        for (const edge of currentEdges) {
          if (idMap.has(edge.source) && idMap.has(edge.target)) {
            newEdges.push({
              ...edge,
              id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              source: idMap.get(edge.source)!,
              target: idMap.get(edge.target)!,
              selected: true,
            });
          }
        }
        const nextEdges = currentEdges
          .map((e) => (e.selected ? { ...e, selected: false } : e))
          .concat(newEdges);
        edgesRef.current = nextEdges;
        queueMicrotask(() => persistCanvas(nextNodes, nextEdges));
        return nextEdges;
      });

      return nextNodes;
    });
  }, [edgesRef, persistCanvas, setEdges, setNodes]);

  const alignSelection = useCallback(
    (direction: AlignDirection) => {
      setNodes((current) => {
        const base = current.filter((n) => n.selected).map((n) => n.id);
        const ids = expandSelectionToMembers(current, base);
        if (ids.length < 2) return current;
        const next = alignNodes(current, ids, direction);
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const distributeSelection = useCallback(
    (direction: DistributeDirection) => {
      setNodes((current) => {
        const base = current.filter((n) => n.selected).map((n) => n.id);
        const ids = expandSelectionToMembers(current, base);
        if (ids.length < 3) return current;
        const next = distributeNodes(current, ids, direction);
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditing =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        if (isEditing) return;
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        if (isEditing) return;
        e.preventDefault();
        duplicateSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setNodes, setEdges, duplicateSelection]);

  return { alignSelection, distributeSelection, duplicateSelection };
}
