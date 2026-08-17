import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import {
  CANVAS_SNAP_GRID,
  DEFAULT_FILE_CARD_HEIGHT,
  DEFAULT_FILE_CARD_WIDTH,
  DEFAULT_LINK_CARD_HEIGHT,
  DEFAULT_LINK_CARD_WIDTH,
  createFileCardId,
  createLinkCardId,
  snapToGrid,
} from "./canvasConstants";

export interface UseCanvasFileOpsOptions {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  edgesRef: MutableRefObject<Edge[]>;
  persistCanvas: (nextNodes: Node[], nextEdges: Edge[]) => void;
  onCreateNote?: (title: string, content?: string) => Promise<string>;
}

export function useCanvasFileOps({
  setNodes,
  edgesRef,
  persistCanvas,
  onCreateNote,
}: UseCanvasFileOpsOptions) {
  const { getNodes } = useReactFlow();

  const createFileCard = useCallback(
    (
      filePath: string,
      position: { x: number; y: number },
      subpath?: string,
    ) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const posX = Number.isFinite(position?.x) ? position.x : 0;
      const posY = Number.isFinite(position?.y) ? position.y : 0;
      const newNode: Node = {
        id: createFileCardId(),
        type: "file",
        position: {
          x: snapToGrid(posX, gridX),
          y: snapToGrid(posY, gridY),
        },
        style: {
          width: DEFAULT_FILE_CARD_WIDTH,
          height: DEFAULT_FILE_CARD_HEIGHT,
        },
        data: {
          type: "file",
          file: filePath,
          ...(subpath ? { subpath } : {}),
        },
      };

      setNodes((current) => {
        const next = [...current, newNode];
        persistCanvas(next, edgesRef.current);
        return next;
      });
      return newNode;
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const createLinkCard = useCallback(
    (url: string, position: { x: number; y: number }) => {
      const [gridX, gridY] = CANVAS_SNAP_GRID;
      const posX = Number.isFinite(position?.x) ? position.x : 0;
      const posY = Number.isFinite(position?.y) ? position.y : 0;
      const newNode: Node = {
        id: createLinkCardId(),
        type: "link",
        position: {
          x: snapToGrid(posX, gridX),
          y: snapToGrid(posY, gridY),
        },
        style: {
          width: DEFAULT_LINK_CARD_WIDTH,
          height: DEFAULT_LINK_CARD_HEIGHT,
        },
        data: {
          type: "link",
          url,
        },
      };

      setNodes((current) => {
        const next = [...current, newNode];
        persistCanvas(next, edgesRef.current);
        return next;
      });
      return newNode;
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const swapNodeFile = useCallback(
    (nodeId: string, newFilePath: string, newSubpath?: string) => {
      setNodes((current) => {
        const next = current.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              file: newFilePath,
              subpath: newSubpath,
            },
          };
        });
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const swapNodeUrl = useCallback(
    (nodeId: string, newUrl: string) => {
      setNodes((current) => {
        const next = current.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              url: newUrl,
            },
          };
        });
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, persistCanvas, setNodes],
  );

  const convertTextCardToFile = useCallback(
    async (nodeId: string, customTitle?: string) => {
      const targetNode = getNodes().find((n) => n.id === nodeId);
      if (!targetNode) return;

      const rawText =
        typeof targetNode.data?.text === "string" ? targetNode.data.text : "";

      let noteTitle = customTitle?.trim();
      if (!noteTitle) {
        const firstLine = rawText.split("\n")[0]?.trim() || "";
        const cleanFirstLine = firstLine
          .replace(/^#+\s*/, "")
          .replace(/[[\]]/g, "")
          .trim();
        noteTitle = cleanFirstLine.slice(0, 40) || `Note ${Date.now()}`;
      }

      let createdPath = `${noteTitle}.md`;
      if (onCreateNote) {
        try {
          createdPath = await onCreateNote(noteTitle, rawText);
        } catch (e) {
          console.error("Failed to create note from card", e);
          return;
        }
      }

      setNodes((current) => {
        const next = current.map((node) => {
          if (node.id !== nodeId) return node;
          const currentWidth =
            typeof node.style?.width === "number" ? node.style.width : 250;
          const currentHeight =
            typeof node.style?.height === "number" ? node.style.height : 120;

          const dataCopy: Record<string, unknown> = {
            ...((node.data ?? {}) as Record<string, unknown>),
            type: "file",
            file: createdPath,
          };
          delete dataCopy.text;

          return {
            ...node,
            type: "file",
            style: {
              ...node.style,
              width: Math.max(currentWidth, DEFAULT_FILE_CARD_WIDTH),
              height: Math.max(currentHeight, DEFAULT_FILE_CARD_HEIGHT),
            },
            data: dataCopy,
          };
        });
        persistCanvas(next, edgesRef.current);
        return next;
      });
    },
    [edgesRef, getNodes, onCreateNote, persistCanvas, setNodes],
  );

  return {
    createFileCard,
    createLinkCard,
    swapNodeFile,
    swapNodeUrl,
    convertTextCardToFile,
  };
}

