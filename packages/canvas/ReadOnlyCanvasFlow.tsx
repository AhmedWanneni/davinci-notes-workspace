import { memo, type JSX } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import { canvasNodeTypes } from "./canvasNodeTypes";
import { canvasEdgeTypes } from "./canvasEdgeTypes";

export interface ReadOnlyCanvasFlowProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

function ReadOnlyCanvasFlowComponent({
  nodes,
  edges,
  className,
}: ReadOnlyCanvasFlowProps): JSX.Element {
  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", position: "relative" }}
      data-testid="nested-canvas-flow"
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={canvasNodeTypes}
          edgeTypes={canvasEdgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          fitView={true}
          fitViewOptions={{ padding: 0.1 }}
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
      </ReactFlowProvider>
    </div>
  );
}

export const ReadOnlyCanvasFlow = memo(ReadOnlyCanvasFlowComponent);
