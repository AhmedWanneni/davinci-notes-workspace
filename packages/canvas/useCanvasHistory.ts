import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Edge, Node } from "@xyflow/react";

const MAX_HISTORY = 50;

interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface UseCanvasHistoryOptions {
  nodes: Node[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: (action: SetStateAction<Edge[]>) => void;
  persistCanvas: (nodes: Node[], edges: Edge[]) => void;
}

export function useCanvasHistory({
  nodes,
  edges,
  setNodes,
  setEdges,
  persistCanvas,
}: UseCanvasHistoryOptions) {
  const historyRef = useRef<CanvasSnapshot[]>([]);
  const pointerRef = useRef(-1);
  const isNavigatingRef = useRef(false);
  const [, setVersion] = useState(0);

  // Initialize first snapshot once nodes or edges are populated
  useEffect(() => {
    if (historyRef.current.length === 0 && (nodes.length > 0 || edges.length > 0)) {
      historyRef.current = [{ nodes, edges }];
      pointerRef.current = 0;
      setVersion((v) => v + 1);
    }
  }, [edges, nodes]);

  const recordSnapshot = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    if (isNavigatingRef.current) return;
    const history = historyRef.current.slice(0, pointerRef.current + 1);
    if (history.length >= MAX_HISTORY) {
      history.shift();
    }
    history.push({ nodes: nextNodes, edges: nextEdges });
    historyRef.current = history;
    pointerRef.current = history.length - 1;
    setVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    isNavigatingRef.current = true;
    pointerRef.current -= 1;
    const prev = historyRef.current[pointerRef.current];
    if (prev) {
      setNodes(prev.nodes);
      setEdges(prev.edges);
      persistCanvas(prev.nodes, prev.edges);
    }
    setVersion((v) => v + 1);
    queueMicrotask(() => {
      isNavigatingRef.current = false;
    });
  }, [persistCanvas, setEdges, setNodes]);

  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    isNavigatingRef.current = true;
    pointerRef.current += 1;
    const next = historyRef.current[pointerRef.current];
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      persistCanvas(next.nodes, next.edges);
    }
    setVersion((v) => v + 1);
    queueMicrotask(() => {
      isNavigatingRef.current = false;
    });
  }, [persistCanvas, setEdges, setNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (!isMac && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  return {
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
    undo,
    redo,
    recordSnapshot,
  };
}
