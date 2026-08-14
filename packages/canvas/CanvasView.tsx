import { useEffect, useMemo, type JSX } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { parseCanvas } from "./parseCanvas";
import { jsonCanvasToReactFlow } from "./canvasTranslation";
import { canvasNodeTypes } from "./canvasNodeTypes";
import { canvasEdgeTypes } from "./canvasEdgeTypes";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { CanvasControls } from "./CanvasControls";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { useCanvasInteractions } from "./useCanvasInteractions";
import { useCanvasPersistence } from "./useCanvasPersistence";
import styles from "./CanvasView.module.scss";

export interface CanvasViewProps {
  path?: string;
  initialContent?: string;
  onContentChange?: (path: string, content: string) => void;
  className?: string;
}

function CanvasShell({
  path,
  initialContent,
  onContentChange,
  className,
}: CanvasViewProps): JSX.Element {
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
    distributeSelection,
    handleContextCreate,
    handleContextDelete,
    handleContextDeleteEdge,
    handleContextEditEdgeLabel,
    handleContextSelectEdgeColor,
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
    }),
    [
      deleteEdge,
      editingEdgeId,
      onEdgeColorChange,
      onEdgeLabelChange,
      onLayoutChange,
      onNodeTextChange,
      setEditingEdgeId,
    ],
  );

  return (
    <CanvasEditorContext.Provider value={editorContextValue}>
      <div
        className={`${styles["canvas-wrapper"]} ${className ?? ""}`.trim()}
        data-testid="canvas-shell"
      >
        <div className={styles["canvas-container"]}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={canvasNodeTypes}
            edgeTypes={canvasEdgeTypes}
            connectionMode={ConnectionMode.Loose}
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
            deleteKeyCode={["Backspace", "Delete"]}
            selectionOnDrag={true}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Shift"
            panOnDrag={[1, 2]}
            panActivationKeyCode="Space"
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            minZoom={0.1}
            maxZoom={2}
            fitView={true}
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="var(--color-border-subtle, #333333)"
            />
          </ReactFlow>

          {nodes.length === 0 && <CanvasEmptyState />}

          <CanvasControls
            onCreateTextCard={createTextCardAtCenter}
            onAlign={alignSelection}
            onDistribute={distributeSelection}
          />

          {contextMenu && (
            <CanvasContextMenu
              menu={contextMenu}
              onCreateTextCard={handleContextCreate}
              onDeleteNode={handleContextDelete}
              onDeleteEdge={handleContextDeleteEdge}
              onEditEdgeLabel={handleContextEditEdgeLabel}
              onSelectEdgeColor={handleContextSelectEdgeColor}
              onClose={closeContextMenu}
            />
          )}
        </div>
      </div>
    </CanvasEditorContext.Provider>
  );
}

/**
 * React Flow Canvas View Component with Provider.
 */
export function CanvasView(props: CanvasViewProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <CanvasShell {...props} />
    </ReactFlowProvider>
  );
}
