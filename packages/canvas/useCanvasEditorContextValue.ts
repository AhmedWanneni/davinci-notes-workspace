import { useMemo } from "react";
import type { CanvasColor } from "./CanvasColor";
import type { CanvasEditorContextValue } from "./CanvasEditorContext";
import { normalizeCanvasPath } from "./nestedCanvasUtils";

export interface UseCanvasEditorContextParams {
  onNodeTextChange: (nodeId: string, text: string) => void;
  onLayoutChange: () => void;
  onDeleteNode?: (nodeId: string) => void;
  onNodeColorChange?: (nodeId: string, color?: CanvasColor) => void;
  onEdgeLabelChange?: (edgeId: string, label: string) => void;
  onEdgeColorChange?: (edgeId: string, color?: CanvasColor) => void;
  deleteEdge?: (edgeId: string) => void;
  editingEdgeId?: string | null;
  setEditingEdgeId?: (edgeId: string | null) => void;
  allNotePaths?: readonly string[];
  notesContent?: Record<string, string>;
  readNoteContent?: (path: string) => Promise<string> | string;
  onOpenFile?: (path: string) => void;
  swapNodeFile?: (nodeId: string, newPath: string, subpath?: string) => void;
  swapNodeUrl?: (nodeId: string, newUrl: string) => void;
  exportViewport?: () => Promise<void>;
  exportFullCanvas?: () => Promise<void>;
  isExporting?: boolean;
  onCreateNote?: (title: string, content?: string) => Promise<string>;
  convertTextCardToFile?: (nodeId: string) => Promise<void>;
  resolveMediaUrl?: (path: string) => string | Promise<string>;
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
  path?: string;
}

export function useCanvasEditorContextValue(
  params: UseCanvasEditorContextParams,
): CanvasEditorContextValue {
  const {
    onNodeTextChange,
    onLayoutChange,
    onDeleteNode,
    onNodeColorChange,
    onEdgeLabelChange,
    onEdgeColorChange,
    deleteEdge,
    editingEdgeId,
    setEditingEdgeId,
    allNotePaths = [],
    notesContent = {},
    readNoteContent,
    onOpenFile,
    swapNodeFile,
    swapNodeUrl,
    exportViewport,
    exportFullCanvas,
    isExporting,
    onCreateNote,
    convertTextCardToFile,
    resolveMediaUrl,
    onSaveMediaFile,
    path,
  } = params;

  return useMemo(
    () => ({
      onNodeTextChange,
      onLayoutChange,
      onDeleteNode,
      onNodeColorChange,
      onEdgeLabelChange,
      onEdgeColorChange,
      deleteEdge,
      editingEdgeId,
      setEditingEdgeId,
      allNotePaths,
      notesContent,
      readNoteContent,
      onOpenFile,
      onNodeFileChange: swapNodeFile,
      onNodeUrlChange: swapNodeUrl,
      onExportViewport: exportViewport,
      onExportFullCanvas: exportFullCanvas,
      isExporting,
      onCreateNote,
      onConvertTextCardToFile: convertTextCardToFile,
      resolveMediaUrl,
      onSaveMediaFile,
      ancestorCanvasPaths: path ? [normalizeCanvasPath(path)] : [],
    }),
    [
      allNotePaths,
      convertTextCardToFile,
      deleteEdge,
      editingEdgeId,
      exportFullCanvas,
      exportViewport,
      isExporting,
      notesContent,
      onCreateNote,
      onDeleteNode,
      onEdgeColorChange,
      onEdgeLabelChange,
      onLayoutChange,
      onNodeColorChange,
      onNodeTextChange,
      onOpenFile,
      onSaveMediaFile,
      path,
      readNoteContent,
      resolveMediaUrl,
      setEditingEdgeId,
      swapNodeFile,
      swapNodeUrl,
    ],
  );
}
