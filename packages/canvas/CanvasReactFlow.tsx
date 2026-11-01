import { useCallback, type JSX, type MouseEvent as ReactMouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
  type OnNodesDelete,
  type OnReconnect,
  type Viewport,
} from "@xyflow/react";
import { canvasNodeTypes } from "./canvasNodeTypes";
import { canvasEdgeTypes } from "./canvasEdgeTypes";
import { CANVAS_SNAP_GRID } from "./canvasConstants";

export interface CanvasReactFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeDragStart?: OnNodeDrag;
  onNodeDrag?: OnNodeDrag;
  onNodeDragStop?: OnNodeDrag;
  onNodesDelete?: OnNodesDelete;
  onConnect?: OnConnect;
  onReconnect?: OnReconnect;
  onReconnectStart?: (
    event: ReactMouseEvent | MouseEvent,
    edge: Edge,
    handleType: "source" | "target",
  ) => void;
  onReconnectEnd?: (
    event: MouseEvent | TouchEvent,
    edge: Edge,
    handleType: "source" | "target",
  ) => void;
  onEdgeContextMenu?: (event: ReactMouseEvent | MouseEvent, edge: Edge) => void;
  onPaneClick?: (event: ReactMouseEvent | MouseEvent) => void;
  onPaneContextMenu?: (event: ReactMouseEvent | MouseEvent) => void;
  onNodeContextMenu?: (event: ReactMouseEvent | MouseEvent, node: Node) => void;
}

export function CanvasReactFlow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onNodesDelete,
  onConnect,
  onReconnect,
  onReconnectStart,
  onReconnectEnd,
  onEdgeContextMenu,
  onPaneClick,
  onPaneContextMenu,
  onNodeContextMenu,
}: CanvasReactFlowProps): JSX.Element {
  const { setViewport } = useReactFlow();

  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, vp: Viewport) => {
      const rx = Math.round(vp.x);
      const ry = Math.round(vp.y);
      if (Math.abs(rx - vp.x) > 0.001 || Math.abs(ry - vp.y) > 0.001) {
        setViewport({ x: rx, y: ry, zoom: vp.zoom });
      }
    },
    [setViewport],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={canvasNodeTypes}
      edgeTypes={canvasEdgeTypes}
      connectionMode={ConnectionMode.Loose}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
      snapToGrid={true}
      snapGrid={CANVAS_SNAP_GRID}
      panOnDrag={[1, 2]}
      panActivationKeyCode="Space"
      zoomOnScroll={true}
      zoomOnPinch={true}
      zoomOnDoubleClick={false}
      minZoom={0.1}
      maxZoom={2}
      fitView={false}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      onMoveEnd={handleMoveEnd}
      proOptions={{ hideAttribution: true }}
      onlyRenderVisibleElements={true}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--color-border-subtle)"
      />
    </ReactFlow>
  );
}
