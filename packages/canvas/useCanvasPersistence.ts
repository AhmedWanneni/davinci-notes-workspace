import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Edge, Node } from "@xyflow/react";
import {
  jsonCanvasToReactFlow,
  reactFlowToJsonCanvas,
} from "./canvasTranslation";
import { parseCanvas } from "./parseCanvas";
import { serializeCanvas } from "./serializeCanvas";

export interface UseCanvasPersistenceOptions {
  initialContent?: string;
  path?: string;
  onContentChange?: (path: string, content: string) => void;
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
}

export function useCanvasPersistence({
  initialContent,
  path,
  onContentChange,
  setNodes,
  setEdges,
}: UseCanvasPersistenceOptions) {
  const lastPathRef = useRef<string | undefined>(path);
  const lastSerializedRef = useRef<string | null>(initialContent ?? null);
  const edgesRef = useRef<Edge[]>([]);

  const persistCanvas = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!onContentChange || !path) return;
      const serialized = serializeCanvas(
        reactFlowToJsonCanvas(nextNodes, nextEdges),
      );
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      onContentChange(path, serialized);
    },
    [onContentChange, path],
  );

  const setEdgesWithRef = useCallback(
    (action: SetStateAction<Edge[]>) => {
      setEdges((current) => {
        const next = typeof action === "function" ? action(current) : action;
        edgesRef.current = next;
        return next;
      });
    },
    [setEdges],
  );

  useEffect(() => {
    const isNewPath = path !== lastPathRef.current;
    if (isNewPath) {
      lastPathRef.current = path;
      lastSerializedRef.current = null;
    }

    const incoming = initialContent ?? "";
    if (!isNewPath && incoming === lastSerializedRef.current) return;

    try {
      const parsed = parseCanvas(incoming);
      const rfState = jsonCanvasToReactFlow(parsed);
      setNodes(rfState.nodes);
      setEdgesWithRef(rfState.edges);
      lastSerializedRef.current = incoming;
    } catch {
      setNodes([]);
      setEdgesWithRef([]);
    }
  }, [initialContent, path, setEdgesWithRef, setNodes]);

  return { persistCanvas, edgesRef, setEdgesWithRef, lastSerializedRef };
}
