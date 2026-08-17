import { useEffect, useMemo, useCallback, type JSX } from "react";
import {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { parseCanvas } from "./parseCanvas";
import { jsonCanvasToReactFlow } from "./canvasTranslation";
import { CanvasContextMenuOverlay } from "./CanvasContextMenuOverlay";
import { CanvasControls } from "./CanvasControls";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { CanvasReactFlow } from "./CanvasReactFlow";
import { normalizeCanvasPath } from "./nestedCanvasUtils";
import { useCanvasDropPaste } from "./useCanvasDropPaste";
import { useCanvasExport } from "./useCanvasExport";

import { useCanvasInteractions } from "./useCanvasInteractions";
import { useCanvasPersistence } from "./useCanvasPersistence";
import styles from "./CanvasView.module.scss";

export interface CanvasViewProps {
  path?: string;
  initialContent?: string;
  onContentChange?: (path: string, content: string) => void;
  allNotePaths?: readonly string[];
  notesContent?: Record<string, string>;
  readNoteContent?: (path: string) => Promise<string> | string;
  onOpenFile?: (path: string) => void;
  onCreateNote?: (title: string, content?: string) => Promise<string>;
  resolveMediaUrl?: (path: string) => string | Promise<string>;
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
  onExportImage?: (dataUrl: string) => Promise<void> | void;
  className?: string;
}

function CanvasShell({
  path,
  initialContent,
  onContentChange,
  allNotePaths = [],
  notesContent = {},
  readNoteContent,
  onOpenFile,
  onCreateNote,
  resolveMediaUrl,
  onSaveMediaFile,
  onExportImage,
  className,
}: CanvasViewProps): JSX.Element {
  const { screenToFlowPosition } = useReactFlow();

  const parsedInitial = useMemo(() => {
    try {
      return parseCanvas(initialContent ?? "");
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [initialContent]);

  const initialRfState = useMemo(
    () => jsonCanvasToReactFlow(parsedInitial),
    [parsedInitial],
  );

  const [nodes, setNodes] = useNodesState(initialRfState.nodes);
  const [edges, setEdges] = useEdgesState(initialRfState.edges);

  const { persistCanvas, edgesRef, setEdgesWithRef } = useCanvasPersistence({
    initialContent,
    path,
    onContentChange,
    setNodes,
    setEdges,
  });

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges, edgesRef]);

  const {
    alignSelection,
    contextMenu,
    closeContextMenu,
    createTextCardAtCenter,
    createFileCard,
    createLinkCard,
    swapNodeFile,
    swapNodeUrl,
    convertTextCardToFile,
    deleteNode,
    distributeSelection,
    handleContextCreateCard,
    handleContextCreateFileCard,
    handleContextCreateEmptyGroup,
    handleContextCreateGroupFromSelection,
    handleContextDeleteEdge,
    handleContextEditEdgeLabel,
    handleContextSelectEdgeColor,
    handleContextSelectNodeColor,
    handleContextConvertTextToFile,
    handleContextOpenFile,
    handleEdgesChange,
    handleNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onLayoutChange,
    onNodeTextChange,
    onNodesDelete,
    onNodeContextMenu,
    onEdgeContextMenu,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onEdgeLabelChange,
    onEdgeColorChange,
    deleteEdge,
    editingEdgeId,
    setEditingEdgeId,
    onPaneClick,
    onPaneContextMenu,
  } = useCanvasInteractions({
    setNodes,
    setEdges: setEdgesWithRef,
    edgesRef,
    persistCanvas,
    onCreateNote,
    onOpenFile,
    allNotePaths,
  });

  const { handleDragOver, handleDrop, handlePaste } = useCanvasDropPaste({
    allNotePaths,
    createFileCard,
    createLinkCard,
    screenToFlowPosition,
    onSaveMediaFile,
  });

  const handleDefaultExport = useCallback(
    (dataUrl: string) => {
      if (onExportImage) {
        onExportImage(dataUrl);
        return;
      }
      // Default browser download fallback
      const link = document.createElement("a");
      link.download = `canvas-export-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    },
    [onExportImage],
  );

  const { isExporting, exportViewport, exportFullCanvas } = useCanvasExport({
    onExport: handleDefaultExport,
  });

  const editorContextValue = useMemo(
    () => ({
      onNodeTextChange,
      onLayoutChange,
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
      onEdgeColorChange,
      onEdgeLabelChange,
      onLayoutChange,
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

  return (
    <CanvasEditorContext.Provider value={editorContextValue}>
      <div
        className={`${styles["canvas-wrapper"]} ${className ?? ""}`.trim()}
        data-testid="canvas-shell"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <div className={styles["canvas-container"]}>
          <CanvasReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
          />

          {nodes.length === 0 && <CanvasEmptyState />}

          {isExporting && (
            <div className={styles["canvas-export-overlay"]} data-testid="export-overlay">
              <div className={styles["canvas-export-overlay__content"]}>
                <span>Exporting Canvas...</span>
              </div>
            </div>
          )}

          <CanvasControls
            onCreateTextCard={createTextCardAtCenter}
            onAlign={alignSelection}
            onDistribute={distributeSelection}
            onExportViewport={exportViewport}
            onExportFullCanvas={exportFullCanvas}
            isExporting={isExporting}
          />

          <CanvasContextMenuOverlay
            contextMenu={contextMenu}
            onCreateTextCard={handleContextCreateCard}
            onCreateFileCard={handleContextCreateFileCard}
            onCreateEmptyGroup={handleContextCreateEmptyGroup}
            onCreateGroupFromSelection={handleContextCreateGroupFromSelection}
            onDeleteNode={deleteNode}
            onConvertTextToFile={handleContextConvertTextToFile}
            onOpenFile={handleContextOpenFile}
            onDeleteEdge={handleContextDeleteEdge}
            onEditEdgeLabel={handleContextEditEdgeLabel}
            onSelectEdgeColor={handleContextSelectEdgeColor}
            onSelectNodeColor={handleContextSelectNodeColor}
            onClose={closeContextMenu}
          />
        </div>
      </div>
    </CanvasEditorContext.Provider>
  );
}

export function CanvasView(props: CanvasViewProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <CanvasShell {...props} />
    </ReactFlowProvider>
  );
}
