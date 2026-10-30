import { useEffect, useRef } from "react";
import * as d3Force from "d3-force";
import { select } from "d3-selection";
import { drag } from "d3-drag";

export interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  label: string;
  degree?: number;
  radius?: number;
}

export interface SimEdge extends d3Force.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export interface UseGraphSimulationParams {
  containerRef: React.RefObject<SVGGElement | null>;
  nodes: SimNode[];
  edges: SimEdge[];
}

export function useGraphSimulation({
  containerRef,
  nodes,
  edges,
}: UseGraphSimulationParams) {
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const container = select(containerRef.current);

    nodes.forEach((node, i) => {
      if (node.x === undefined || node.y === undefined) {
        const angle = i * 0.75;
        const radius = 24 * Math.sqrt(i);
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
    });

    const simulation = d3Force
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3Force
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance(70)
          .strength(0.3),
      )
      .force("charge", d3Force.forceManyBody().strength(-75).distanceMax(350))
      .force("x", d3Force.forceX(0).strength(0.04))
      .force("y", d3Force.forceY(0).strength(0.04))
      .force("center", d3Force.forceCenter(0, 0))
      .force(
        "collide",
        d3Force
          .forceCollide<SimNode>()
          .radius((d) => (d.radius ?? 4) + 12)
          .iterations(2),
      )
      .velocityDecay(0.4);

    const dragBehavior = drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        isDraggingRef.current = false;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        isDraggingRef.current = true;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      });

    const linkElements = container
      .selectAll<SVGLineElement, SimEdge>(".graph-edge")
      .data(edges);
    const nodeElements = container
      .selectAll<SVGGElement, SimNode>(".graph-node-group")
      .data(nodes);

    nodeElements.call(dragBehavior);

    nodeElements
      .on("pointerenter", function (_event, d) {
        if (isDraggingRef.current) return;
        const connectedIds = new Set<string>([d.id]);

        linkElements.each(function (edge) {
          const srcId =
            typeof edge.source === "string" ? edge.source : edge.source.id;
          const tgtId =
            typeof edge.target === "string" ? edge.target : edge.target.id;
          if (srcId === d.id) {
            connectedIds.add(tgtId);
            select(this)
              .classed("is-highlighted", true)
              .classed("is-dimmed", false);
          } else if (tgtId === d.id) {
            connectedIds.add(srcId);
            select(this)
              .classed("is-highlighted", true)
              .classed("is-dimmed", false);
          } else {
            select(this)
              .classed("is-highlighted", false)
              .classed("is-dimmed", true);
          }
        });

        nodeElements.each(function (n) {
          const isTarget = n.id === d.id;
          const isConnected = connectedIds.has(n.id);
          select(this)
            .classed("is-hovered", isTarget)
            .classed("is-highlighted", !isTarget && isConnected)
            .classed("is-dimmed", !isConnected);
        });
      })
      .on("pointerleave", function () {
        if (isDraggingRef.current) return;
        linkElements
          .classed("is-highlighted", false)
          .classed("is-dimmed", false);
        nodeElements
          .classed("is-hovered", false)
          .classed("is-highlighted", false)
          .classed("is-dimmed", false);
      });

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
    };
  }, [containerRef, nodes, edges]);

  return { isDraggingRef };
}
