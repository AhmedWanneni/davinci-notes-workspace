import React, { useEffect, useRef } from "react";
import * as d3Force from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
import { Tooltip, TooltipProvider } from "@app/design-system";
import styles from "./GraphView.module.scss";

export interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  label: string;
}

export interface SimEdge extends d3Force.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

interface GraphRendererProps {
  nodes: SimNode[];
  edges: SimEdge[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  nodes,
  edges,
  activeNodeId,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (nodes.length === 0) return;

    const svg = select(svgRef.current);
    const container = select(containerRef.current);

    // Zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    let initialized = false;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      // Only center on the very first time we get a valid dimension
      // This prevents the graph from shifting wildly if the sidebar is resized while interacting
      if (!initialized) {
        svg.call(
          zoomBehavior.transform,
          zoomIdentity.translate(width / 2, height / 2),
        );
        initialized = true;
      }
    });

    resizeObserver.observe(svgRef.current);

    // Force simulation
    const simulation = d3Force
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3Force
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3Force.forceManyBody().strength(-200))
      .force("center", d3Force.forceCenter(0, 0))
      .force("collide", d3Force.forceCollide().radius(20));

    // Drag behavior
    const dragBehavior = drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Bind data to existing DOM elements rendered by React
    const linkElements = container
      .selectAll<SVGLineElement, SimEdge>(".graph-edge")
      .data(edges);
    const nodeElements = container
      .selectAll<SVGGElement, SimNode>(".graph-node-group")
      .data(nodes);

    // Apply drag
    nodeElements.call(dragBehavior);

    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
    };
  }, [nodes, edges]);

  return (
    <TooltipProvider>
      <svg ref={svgRef} className={styles.graphSvg}>
        <g ref={containerRef}>
          {edges.map((edge, i) => (
            <line key={i} className={`${styles.graphEdge} graph-edge`} />
          ))}
          {nodes.map((node) => (
            <Tooltip key={node.id} content={node.label}>
              <g className={`${styles.graphNodeGroup} graph-node-group`}>
                <circle
                  className={`${styles.graphNode} ${
                    node.id === activeNodeId ? styles.isActive : ""
                  }`}
                  r={8}
                  onClick={() => onNodeClick(node.id)}
                />
                <text className={styles.nodeLabel} y={18} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            </Tooltip>
          ))}
        </g>
      </svg>
    </TooltipProvider>
  );
};
