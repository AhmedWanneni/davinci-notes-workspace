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
import { CanvasEditorContext } from "./CanvasEditorContext";
import { CanvasFlowArea } from "./CanvasFlowArea";
import { useCanvasDropPaste } from "./useCanvasDropPaste";
import { useCanvasExport } from "./useCanvasExport";
import { useCanvasHistory } from "./useCanvasHistory";
import { useCanvasInteractions } from "./useCanvasInteractions";
import { useCanvasPersistence } from "./useCanvasPersistence";
import { useCanvasEditorContextValue } from "./useCanvasEditorContextValue";
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
  onPickLocalImage?: () => Promise<string | null>;
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
  onPickLocalImage,
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

  const { canUndo, canRedo, undo, redo, recordSnapshot } = useCanvasHistory({
    nodes,
    edges,
    setNodes,
    setEdges: setEdgesWithRef,
    persistCanvas,
  });

  const handlePersistAndRecord = useCallback(
    (nextNodes: typeof nodes, nextEdges: typeof edges) => {
      persistCanvas(nextNodes, nextEdges);
      recordSnapshot(nextNodes, nextEdges);
    },
    [persistCanvas, recordSnapshot],
  );

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges, edgesRef]);

  const interactions = useCanvasInteractions({
    setNodes,
    setEdges: setEdgesWithRef,
    edgesRef,
    persistCanvas: handlePersistAndRecord,
    onCreateNote,
    onOpenFile,
    allNotePaths,
  });

  const { handleDragOver, handleDrop, handlePaste } = useCanvasDropPaste({
    allNotePaths,
    createFileCard: interactions.createFileCard,
    createLinkCard: interactions.createLinkCard,
    screenToFlowPosition,
    onSaveMediaFile,
  });

  const handleDefaultExport = useCallback(
    (dataUrl: string) => {
      if (onExportImage) return onExportImage(dataUrl);
      const link = document.createElement("a");
      link.download = `canvas-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    },
    [onExportImage],
  );

  const { isExporting, exportViewport, exportFullCanvas } = useCanvasExport({
    onExport: handleDefaultExport,
  });

  const editorContextValue = useCanvasEditorContextValue({
    onNodeTextChange: interactions.onNodeTextChange,
    onLayoutChange: interactions.onLayoutChange,
    onDeleteNode: interactions.deleteNode,
    onNodeColorChange: interactions.setNodeColor,
    onEdgeLabelChange: interactions.onEdgeLabelChange,
    onEdgeColorChange: interactions.onEdgeColorChange,
    deleteEdge: interactions.deleteEdge,
    editingEdgeId: interactions.editingEdgeId,
    setEditingEdgeId: interactions.setEditingEdgeId,
    allNotePaths,
    notesContent,
    readNoteContent,
    onOpenFile,
    swapNodeFile: interactions.swapNodeFile,
    swapNodeUrl: interactions.swapNodeUrl,
    exportViewport,
    exportFullCanvas,
    isExporting,
    onCreateNote,
    convertTextCardToFile: interactions.convertTextCardToFile,
    resolveMediaUrl,
    onSaveMediaFile,
    path,
  });

  const handleCreateFileCardAtCenter = useCallback(
    (filePath: string) => {
      interactions.createFileCard(
        filePath,
        screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        }),
      );
    },
    [interactions, screenToFlowPosition],
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
        <CanvasFlowArea
          nodes={nodes}
          edges={edges}
          onNodesChange={interactions.handleNodesChange}
          onEdgesChange={interactions.handleEdgesChange}
          onNodeDragStart={interactions.onNodeDragStart}
          onNodeDrag={interactions.onNodeDrag}
          onNodeDragStop={interactions.onNodeDragStop}
          onNodesDelete={interactions.onNodesDelete}
          onConnect={interactions.onConnect}
          onReconnect={interactions.onReconnect}
          onReconnectStart={interactions.onReconnectStart}
          onReconnectEnd={interactions.onReconnectEnd}
          onEdgeContextMenu={interactions.onEdgeContextMenu}
          onPaneClick={interactions.onPaneClick}
          onPaneContextMenu={interactions.onPaneContextMenu}
          onNodeContextMenu={interactions.onNodeContextMenu}
          isExporting={isExporting}
          allNotePaths={allNotePaths}
          onCreateTextCard={interactions.createTextCardAtCenter}
          onCreateFileCard={handleCreateFileCardAtCenter}
          onPickMedia={onPickLocalImage}
          onSaveMediaFile={onSaveMediaFile}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          contextMenu={interactions.contextMenu}
          handleContextCreateCard={interactions.handleContextCreateCard}
          handleContextCreateFileCard={interactions.handleContextCreateFileCard}
          handleContextCreateEmptyGroup={interactions.handleContextCreateEmptyGroup}
          handleContextCreateGroupFromSelection={interactions.handleContextCreateGroupFromSelection}
          deleteNode={interactions.deleteNode}
          handleContextConvertTextToFile={interactions.handleContextConvertTextToFile}
          handleContextOpenFile={interactions.handleContextOpenFile}
          handleContextDeleteEdge={interactions.handleContextDeleteEdge}
          handleContextEditEdgeLabel={interactions.handleContextEditEdgeLabel}
          handleContextSelectEdgeColor={interactions.handleContextSelectEdgeColor}
          handleContextSelectNodeColor={interactions.handleContextSelectNodeColor}
          closeContextMenu={interactions.closeContextMenu}
        />
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
