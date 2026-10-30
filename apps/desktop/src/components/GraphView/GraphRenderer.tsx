import React, { useEffect, useRef } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, ZoomBehavior } from "d3-zoom";
import { GraphControls } from "./GraphControls";
import {
  useGraphSimulation,
  SimNode,
  SimEdge,
} from "./useGraphSimulation";

export type { SimNode, SimEdge };

export interface GraphRendererProps {
  nodes: SimNode[];
  edges: SimEdge[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  modeControl?: React.ReactNode;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  nodes,
  edges,
  activeNodeId,
  onNodeClick,
  modeControl,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  const { isDraggingRef } = useGraphSimulation({
    containerRef,
    nodes,
    edges,
  });

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    const initialScale =
      nodes.length > 50 ? 0.75 : nodes.length > 15 ? 0.95 : 1.15;
    select(svgRef.current)
      .transition()
      .duration(350)
      .call(
        zoomBehaviorRef.current.transform,
        zoomIdentity.translate(width / 2, height / 2).scale(initialScale),
      );
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (nodes.length === 0) return;

    const svg = select(svgRef.current);
    const container = select(containerRef.current);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    let initialized = false;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;

        if (!initialized) {
          const initialScale =
            nodes.length > 50 ? 0.75 : nodes.length > 15 ? 0.95 : 1.15;
          svg.call(
            zoomBehavior.transform,
            zoomIdentity.translate(width / 2, height / 2).scale(initialScale),
          );
          initialized = true;
        }
      });
      resizeObserver.observe(svgRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [nodes.length]);

  return (
    <>
      <svg ref={svgRef} className="graph-view__svg">
        <g ref={containerRef}>
          {edges.map((edge, i) => (
            <line key={i} className="graph-view__edge graph-edge" />
          ))}
          {nodes.map((node) => {
            const r = node.radius ?? 4;
            return (
              <g
                key={node.id}
                className="graph-view__node-group graph-node-group"
                onClick={() => {
                  if (isDraggingRef.current) return;
                  onNodeClick(node.id);
                }}
              >
                <title>{node.label}</title>
                <circle
                  className="graph-view__node"
                  data-active={node.id === activeNodeId || undefined}
                  r={r}
                />
                <text
                  className="graph-view__label"
                  y={r + 11}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        modeControl={modeControl}
      />
    </>
  );
};
