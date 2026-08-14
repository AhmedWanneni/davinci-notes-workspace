import { createContext, useContext } from "react";
import type { CanvasColor } from "./CanvasColor";

export interface CanvasEditorContextValue {
  onNodeTextChange: (nodeId: string, text: string) => void;
  onLayoutChange: () => void;
  onEdgeLabelChange?: (edgeId: string, label: string) => void;
  onEdgeColorChange?: (edgeId: string, color?: CanvasColor) => void;
  deleteEdge?: (edgeId: string) => void;
  editingEdgeId?: string | null;
  setEditingEdgeId?: (edgeId: string | null) => void;
}

const defaultContextValue: CanvasEditorContextValue = {
  onNodeTextChange: () => {},
  onLayoutChange: () => {},
};

export const CanvasEditorContext =
  createContext<CanvasEditorContextValue | null>(null);

export function useCanvasEditor(): CanvasEditorContextValue {
  const ctx = useContext(CanvasEditorContext);
  return ctx ?? defaultContextValue;
}
