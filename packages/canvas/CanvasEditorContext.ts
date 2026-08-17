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
  // File card operations
  allNotePaths?: readonly string[];
  notesContent?: Record<string, string>;
  readNoteContent?: (path: string) => Promise<string> | string;
  onOpenFile?: (path: string) => void;
  onNodeFileChange?: (
    nodeId: string,
    newFile: string,
    newSubpath?: string,
  ) => void;
  onCreateNote?: (title: string, content?: string) => Promise<string>;
  onConvertTextCardToFile?: (nodeId: string) => Promise<void>;
  // Link card operations
  onNodeUrlChange?: (nodeId: string, newUrl: string) => void;
  // Export operations
  onExportViewport?: () => Promise<void>;
  onExportFullCanvas?: () => Promise<void>;
  isExporting?: boolean;
  // Media operations
  resolveMediaUrl?: (path: string) => string | Promise<string>;
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
  // Nested canvas support: active ancestor chain
  ancestorCanvasPaths?: readonly string[];
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
