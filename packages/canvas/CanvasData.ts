import type { CanvasEdge } from "./CanvasEdge";
import type { CanvasNode } from "./CanvasNode";

/**
 * Top-level JSON Canvas document format.
 * Per the JSON Canvas 1.0 specification, both `nodes` and `edges`
 * arrays are optional.
 */
export interface CanvasData {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}
