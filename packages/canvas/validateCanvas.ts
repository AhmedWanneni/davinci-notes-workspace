import type { CanvasData } from "./CanvasData";
import type { CanvasEdge, CanvasEdgeEnd, CanvasEdgeSide } from "./CanvasEdge";
import type {
  CanvasBackgroundStyle,
  CanvasGroupNode,
  CanvasNode,
  CanvasNodeType,
} from "./CanvasNode";

const VALID_NODE_TYPES: readonly CanvasNodeType[] = [
  "text",
  "file",
  "link",
  "group",
];
const VALID_EDGE_SIDES: readonly CanvasEdgeSide[] = [
  "top",
  "right",
  "bottom",
  "left",
];
const VALID_EDGE_ENDS: readonly CanvasEdgeEnd[] = ["none", "arrow"];
const VALID_BG_STYLES: readonly CanvasBackgroundStyle[] = [
  "cover",
  "ratio",
  "repeat",
];

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function validateNode(node: unknown, index: number): CanvasNode {
  if (!isObject(node)) {
    throw new Error(`Node at index ${index} must be an object`);
  }

  if (typeof node.id !== "string" || !node.id.trim()) {
    throw new Error(`Node at index ${index} is missing a valid string 'id'`);
  }

  if (!VALID_NODE_TYPES.includes(node.type as CanvasNodeType)) {
    throw new Error(
      `Node '${node.id}' has unknown type '${String(node.type)}'`,
    );
  }

  const numericFields: Array<keyof CanvasNode> = ["x", "y", "width", "height"];
  for (const field of numericFields) {
    if (typeof node[field] !== "number" || Number.isNaN(node[field])) {
      throw new Error(
        `Node '${node.id}' has invalid numeric value for '${field}'`,
      );
    }
  }

  if (node.color !== undefined && typeof node.color !== "string") {
    throw new Error(`Node '${node.id}' has non-string 'color'`);
  }

  switch (node.type) {
    case "text":
      if (typeof node.text !== "string") {
        throw new Error(`Text node '${node.id}' must contain a string 'text'`);
      }
      break;
    case "file":
      if (typeof node.file !== "string" || !node.file.trim()) {
        throw new Error(`File node '${node.id}' must contain a string 'file'`);
      }
      if (node.subpath !== undefined && typeof node.subpath !== "string") {
        throw new Error(`File node '${node.id}' has invalid 'subpath'`);
      }
      break;
    case "link":
      if (typeof node.url !== "string" || !node.url.trim()) {
        throw new Error(`Link node '${node.id}' must contain a string 'url'`);
      }
      break;
    case "group": {
      const gNode = node as unknown as CanvasGroupNode;
      if (gNode.label !== undefined && typeof gNode.label !== "string") {
        throw new Error(`Group node '${node.id}' has invalid 'label'`);
      }
      if (
        gNode.background !== undefined &&
        typeof gNode.background !== "string"
      ) {
        throw new Error(`Group node '${node.id}' has invalid 'background'`);
      }
      if (
        gNode.backgroundStyle !== undefined &&
        !VALID_BG_STYLES.includes(gNode.backgroundStyle)
      ) {
        throw new Error(
          `Group node '${node.id}' has invalid 'backgroundStyle'`,
        );
      }
      break;
    }
  }

  return node as unknown as CanvasNode;
}

function validateEdge(edge: unknown, index: number): CanvasEdge {
  if (!isObject(edge)) {
    throw new Error(`Edge at index ${index} must be an object`);
  }

  if (typeof edge.id !== "string" || !edge.id.trim()) {
    throw new Error(`Edge at index ${index} is missing a valid string 'id'`);
  }

  if (typeof edge.fromNode !== "string" || !edge.fromNode.trim()) {
    throw new Error(`Edge '${edge.id}' is missing a valid 'fromNode'`);
  }

  if (typeof edge.toNode !== "string" || !edge.toNode.trim()) {
    throw new Error(`Edge '${edge.id}' is missing a valid 'toNode'`);
  }

  if (
    edge.fromSide !== undefined &&
    !VALID_EDGE_SIDES.includes(edge.fromSide as CanvasEdgeSide)
  ) {
    throw new Error(`Edge '${edge.id}' has invalid 'fromSide'`);
  }

  if (
    edge.toSide !== undefined &&
    !VALID_EDGE_SIDES.includes(edge.toSide as CanvasEdgeSide)
  ) {
    throw new Error(`Edge '${edge.id}' has invalid 'toSide'`);
  }

  if (
    edge.fromEnd !== undefined &&
    !VALID_EDGE_ENDS.includes(edge.fromEnd as CanvasEdgeEnd)
  ) {
    throw new Error(`Edge '${edge.id}' has invalid 'fromEnd'`);
  }

  if (
    edge.toEnd !== undefined &&
    !VALID_EDGE_ENDS.includes(edge.toEnd as CanvasEdgeEnd)
  ) {
    throw new Error(`Edge '${edge.id}' has invalid 'toEnd'`);
  }

  if (edge.color !== undefined && typeof edge.color !== "string") {
    throw new Error(`Edge '${edge.id}' has non-string 'color'`);
  }

  if (edge.label !== undefined && typeof edge.label !== "string") {
    throw new Error(`Edge '${edge.id}' has non-string 'label'`);
  }

  return edge as unknown as CanvasEdge;
}

/**
 * Validates unknown parsed data against the JSON Canvas 1.0 specification.
 * Throws a descriptive Error if validation fails.
 */
export function validateCanvas(data: unknown): CanvasData {
  if (!isObject(data)) {
    throw new Error("Canvas data must be a top-level JSON object");
  }

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  if (data.nodes !== undefined) {
    if (!Array.isArray(data.nodes)) {
      throw new Error("Canvas 'nodes' must be an array");
    }
    data.nodes.forEach((n, idx) => nodes.push(validateNode(n, idx)));
  }

  if (data.edges !== undefined) {
    if (!Array.isArray(data.edges)) {
      throw new Error("Canvas 'edges' must be an array");
    }
    data.edges.forEach((e, idx) => edges.push(validateEdge(e, idx)));
  }

  return { nodes, edges };
}
