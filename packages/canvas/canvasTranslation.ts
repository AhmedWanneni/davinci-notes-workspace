import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { CanvasData } from "./CanvasData";
import type { CanvasEdge } from "./CanvasEdge";
import type { CanvasNode } from "./CanvasNode";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import {
  MAX_GROUP_NESTING_DEPTH,
  assignParentsByBbox,
  getNodeHeight,
  getNodeWidth,
} from "./groupContainment";

export interface CanvasReactFlowState {
  nodes: Node[];
  edges: Edge[];
}

function nodeToAbsolute(
  node: Node,
  nodesById: Map<string, Node>,
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  let depth = 0;
  while (parentId && depth < MAX_GROUP_NESTING_DEPTH) {
    const parent = nodesById.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
    depth++;
  }
  return { x, y };
}

export function jsonNodeToReactFlowNode(node: CanvasNode): Node {
  const { id, type, x, y, width, height, color, ...rest } = node;
  return {
    id,
    type,
    position: { x, y },
    style: { width, height },
    data: { ...rest, color, type },
  };
}

export function reactFlowNodeToJsonNode(
  rfNode: Node,
  nodesById: Map<string, Node> = new Map(),
): CanvasNode {
  const width = getNodeWidth(rfNode);
  const height = getNodeHeight(rfNode);
  const abs = nodeToAbsolute(rfNode, nodesById);
  const d = (rfNode.data ?? {}) as Record<string, unknown>;
  const base = {
    id: rfNode.id,
    x: Math.round(abs.x),
    y: Math.round(abs.y),
    width: Math.round(width),
    height: Math.round(height),
    ...(typeof d.color === "string" ? { color: d.color } : {}),
  };
  const nodeType = (rfNode.type ?? d.type ?? "text") as string;
  switch (nodeType) {
    case "file":
      return {
        ...base,
        type: "file",
        file: (d.file as string) ?? "",
        ...(typeof d.subpath === "string" ? { subpath: d.subpath } : {}),
      };
    case "link":
      return { ...base, type: "link", url: (d.url as string) ?? "" };
    case "group":
      return {
        ...base,
        type: "group",
        ...(typeof d.label === "string" ? { label: d.label } : {}),
        ...(typeof d.background === "string"
          ? { background: d.background }
          : {}),
        ...(typeof d.backgroundStyle === "string"
          ? {
              backgroundStyle: d.backgroundStyle as
                "cover" | "ratio" | "repeat",
            }
          : {}),
      };
    case "text":
    default:
      return { ...base, type: "text", text: (d.text as string) ?? "" };
  }
}

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

export function reactFlowEdgeToJsonEdge(rfEdge: Edge): CanvasEdge {
  const d = (rfEdge.data ?? {}) as Record<string, unknown>;
  const edge: CanvasEdge = {
    id: rfEdge.id,
    fromNode: rfEdge.source,
    toNode: rfEdge.target,
  };
  const fromSide = (rfEdge.sourceHandle ?? d.fromSide) as
    "top" | "right" | "bottom" | "left" | undefined;
  if (fromSide) edge.fromSide = fromSide;
  const toSide = (rfEdge.targetHandle ?? d.toSide) as
    "top" | "right" | "bottom" | "left" | undefined;
  if (toSide) edge.toSide = toSide;
  if (typeof d.fromEnd === "string")
    edge.fromEnd = d.fromEnd as "none" | "arrow";
  if (typeof d.toEnd === "string") edge.toEnd = d.toEnd as "none" | "arrow";
  if (typeof d.color === "string") edge.color = d.color;
  if (typeof rfEdge.label === "string" && rfEdge.label.trim())
    edge.label = rfEdge.label;
  else if (typeof d.label === "string" && d.label.trim()) edge.label = d.label;
  return edge;
}

export function jsonCanvasToReactFlow(data: CanvasData): CanvasReactFlowState {
  const rawNodes = (data.nodes ?? []).map(jsonNodeToReactFlowNode);
  return {
    nodes: assignParentsByBbox(rawNodes),
    edges: (data.edges ?? []).map(jsonEdgeToReactFlowEdge),
  };
}

export function reactFlowToJsonCanvas(
  nodes: Node[],
  edges: Edge[],
): CanvasData {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const jsonNodes = nodes.map((n) => reactFlowNodeToJsonNode(n, nodesById));
  return { nodes: jsonNodes, edges: edges.map(reactFlowEdgeToJsonEdge) };
}
