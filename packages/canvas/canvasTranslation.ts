import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { CanvasData } from "./CanvasData";
import type { CanvasEdge } from "./CanvasEdge";
import type { CanvasNode } from "./CanvasNode";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";

export interface CanvasReactFlowState {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Maps a single JSON Canvas node to a React Flow Node object.
 */
export function jsonNodeToReactFlowNode(node: CanvasNode): Node {
  const { id, type, x, y, width, height, color, ...rest } = node;

  return {
    id,
    type,
    position: { x, y },
    style: { width, height },
    data: {
      ...rest,
      color,
      type,
    },
  };
}

/**
 * Maps a single React Flow Node object back to a JSON Canvas node.
 */
export function reactFlowNodeToJsonNode(rfNode: Node): CanvasNode {
  const width =
    typeof rfNode.style?.width === "number"
      ? rfNode.style.width
      : typeof rfNode.width === "number"
        ? rfNode.width
        : 250;
  const height =
    typeof rfNode.style?.height === "number"
      ? rfNode.style.height
      : typeof rfNode.height === "number"
        ? rfNode.height
        : 150;

  const nodeData = (rfNode.data ?? {}) as Record<string, unknown>;
  const base = {
    id: rfNode.id,
    x: Math.round(rfNode.position.x),
    y: Math.round(rfNode.position.y),
    width: Math.round(width),
    height: Math.round(height),
    ...(typeof nodeData.color === "string" ? { color: nodeData.color } : {}),
  };

  const nodeType = (rfNode.type ?? nodeData.type ?? "text") as string;

  switch (nodeType) {
    case "file":
      return {
        ...base,
        type: "file",
        file: (nodeData.file as string) ?? "",
        ...(typeof nodeData.subpath === "string"
          ? { subpath: nodeData.subpath }
          : {}),
      };
    case "link":
      return {
        ...base,
        type: "link",
        url: (nodeData.url as string) ?? "",
      };
    case "group":
      return {
        ...base,
        type: "group",
        ...(typeof nodeData.label === "string"
          ? { label: nodeData.label }
          : {}),
        ...(typeof nodeData.background === "string"
          ? { background: nodeData.background }
          : {}),
        ...(typeof nodeData.backgroundStyle === "string"
          ? {
              backgroundStyle: nodeData.backgroundStyle as
                "cover" | "ratio" | "repeat",
            }
          : {}),
      };
    case "text":
    default:
      return {
        ...base,
        type: "text",
        text: (nodeData.text as string) ?? "",
      };
  }
}

/**
 * Maps a single JSON Canvas edge to a React Flow Edge object.
 */
export function jsonEdgeToReactFlowEdge(edge: CanvasEdge): Edge {
  const edgeColor = getCanvasEdgeColorCss(edge.color);
  const showArrowEnd = edge.toEnd !== "none";
  const showArrowStart = edge.fromEnd === "arrow";

  return {
    id: edge.id,
    source: edge.fromNode,
    sourceHandle: edge.fromSide,
    target: edge.toNode,
    targetHandle: edge.toSide,
    label: edge.label,
    markerEnd: showArrowEnd
      ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        }
      : undefined,
    markerStart: showArrowStart
      ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        }
      : undefined,
    data: {
      fromSide: edge.fromSide,
      fromEnd: edge.fromEnd,
      toSide: edge.toSide,
      toEnd: edge.toEnd,
      color: edge.color,
      label: edge.label,
    },
  };
}

/**
 * Maps a single React Flow Edge object back to a JSON Canvas edge.
 */
export function reactFlowEdgeToJsonEdge(rfEdge: Edge): CanvasEdge {
  const edgeData = (rfEdge.data ?? {}) as Record<string, unknown>;

  const edge: CanvasEdge = {
    id: rfEdge.id,
    fromNode: rfEdge.source,
    toNode: rfEdge.target,
  };

  const fromSide = (rfEdge.sourceHandle ?? edgeData.fromSide) as
    "top" | "right" | "bottom" | "left" | undefined;
  if (fromSide) edge.fromSide = fromSide;

  const toSide = (rfEdge.targetHandle ?? edgeData.toSide) as
    "top" | "right" | "bottom" | "left" | undefined;
  if (toSide) edge.toSide = toSide;

  if (typeof edgeData.fromEnd === "string") {
    edge.fromEnd = edgeData.fromEnd as "none" | "arrow";
  }
  if (typeof edgeData.toEnd === "string") {
    edge.toEnd = edgeData.toEnd as "none" | "arrow";
  }
  if (typeof edgeData.color === "string") {
    edge.color = edgeData.color;
  }
  if (typeof rfEdge.label === "string" && rfEdge.label.trim()) {
    edge.label = rfEdge.label;
  } else if (typeof edgeData.label === "string" && edgeData.label.trim()) {
    edge.label = edgeData.label;
  }

  return edge;
}

/**
 * Converts a JSON Canvas data document into React Flow nodes and edges.
 */
export function jsonCanvasToReactFlow(data: CanvasData): CanvasReactFlowState {
  const nodes = (data.nodes ?? []).map(jsonNodeToReactFlowNode);
  const edges = (data.edges ?? []).map(jsonEdgeToReactFlowEdge);
  return { nodes, edges };
}

/**
 * Converts React Flow nodes and edges into a spec-compliant JSON Canvas document.
 */
export function reactFlowToJsonCanvas(
  nodes: Node[],
  edges: Edge[],
): CanvasData {
  return {
    nodes: nodes.map(reactFlowNodeToJsonNode),
    edges: edges.map(reactFlowEdgeToJsonEdge),
  };
}
