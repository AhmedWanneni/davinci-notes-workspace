import type { CanvasColor } from "./CanvasColor";

export type CanvasEdgeSide = "top" | "right" | "bottom" | "left";

export type CanvasEdgeEnd = "none" | "arrow";

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: CanvasEdgeSide;
  fromEnd?: CanvasEdgeEnd;
  toNode: string;
  toSide?: CanvasEdgeSide;
  toEnd?: CanvasEdgeEnd;
  color?: CanvasColor;
  label?: string;
}
