export const MAX_CANVAS_NESTING_DEPTH = 3;

export interface CanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  text?: string;
  file?: string;
  url?: string;
  label?: string;
  isCycle?: boolean;
  nestedCanvas?: CanvasDocument;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  toSide?: "top" | "right" | "bottom" | "left";
  label?: string;
}

export interface CanvasDocument {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  hasCycle?: boolean;
}

/**
 * Parses JSON Canvas 1.0 document with strict ancestor-chain cycle detection
 * and maximum depth capping to prevent infinite recursion.
 */
export async function parseCanvasWithCycleDetection(
  rawContent: string,
  currentPath: string,
  fileReader?: (path: string) => Promise<string>,
  ancestorChain: Set<string> = new Set(),
  depth = 0,
): Promise<CanvasDocument> {
  let parsed: { nodes?: unknown[]; edges?: unknown[] };
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return { nodes: [], edges: [] };
  }

  const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const rawEdges = Array.isArray(parsed.edges) ? parsed.edges : [];

  const currentChain = new Set(ancestorChain);
  currentChain.add(currentPath);

  let documentHasCycle = false;
  const processedNodes: CanvasNode[] = [];

  for (const item of rawNodes) {
    if (!item || typeof item !== "object") continue;
    const node = { ...(item as CanvasNode) };

    if (node.type === "file" && node.file && node.file.endsWith(".canvas")) {
      const childPath = node.file;

      // Cycle detection: check if child is already in ancestor stack
      if (currentChain.has(childPath)) {
        documentHasCycle = true;
        processedNodes.push({
          ...node,
          type: "text",
          isCycle: true,
          text: `⚠️ Circular canvas embed: ${childPath}`,
        });
        continue;
      }

      // Depth limit check
      if (depth >= MAX_CANVAS_NESTING_DEPTH) {
        processedNodes.push({
          ...node,
          type: "text",
          text: `⚠️ Max canvas nesting depth (${MAX_CANVAS_NESTING_DEPTH}) reached`,
        });
        continue;
      }

      // Recursively parse child canvas if file reader provided
      if (fileReader) {
        try {
          const childRaw = await fileReader(childPath);
          const childDoc = await parseCanvasWithCycleDetection(
            childRaw,
            childPath,
            fileReader,
            currentChain,
            depth + 1,
          );
          if (childDoc.hasCycle) documentHasCycle = true;
          processedNodes.push({
            ...node,
            nestedCanvas: childDoc,
          });
        } catch {
          processedNodes.push({
            ...node,
            type: "text",
            text: `⚠️ Could not read canvas: ${childPath}`,
          });
        }
        continue;
      }
    }

    processedNodes.push(node);
  }

  const processedEdges: CanvasEdge[] = rawEdges.map((e) => ({
    ...(e as CanvasEdge),
  }));

  return {
    nodes: processedNodes,
    edges: processedEdges,
    hasCycle: documentHasCycle,
  };
}
