import React, { useMemo, useState } from "react";
import { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { GraphRenderer, SimNode, SimEdge } from "./GraphRenderer";
import { EmptyState } from "../EmptyState";
import { ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@app/design-system";

export interface GraphViewProps {
  graph: GraphIndex;
  defaultMode?: "local" | "global";
  onNavigate?: (path: string) => void;
}

const GLOBAL_NODE_LIMIT = 200;

export function getNodeRadius(degree: number): number {
  return Math.min(9, Math.max(4, 3.8 + Math.sqrt(degree) * 1.5));
}

export const GraphView: React.FC<GraphViewProps> = ({
  graph,
  defaultMode = "local",
  onNavigate,
}) => {
  const [mode, setMode] = useState<"local" | "global">(defaultMode);
  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);

  const { nodes, edges } = useMemo(() => {
    let filteredNodes = new Set<string>();

    if (mode === "local" && activeNotePath) {
      filteredNodes.add(activeNotePath);
      for (const edge of graph.edges) {
        if (edge.source === activeNotePath) {
          filteredNodes.add(edge.target);
        } else if (edge.target === activeNotePath) {
          filteredNodes.add(edge.source);
        }
      }
    } else {
      const degrees = new Map<string, number>();
      for (const edge of graph.edges) {
        degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
      }

      const sortedNodeIds = Array.from(graph.nodes.keys()).sort(
        (a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0),
      );

      filteredNodes = new Set(sortedNodeIds.slice(0, GLOBAL_NODE_LIMIT));
    }

    const simEdges: SimEdge[] = [];
    const degreeMap = new Map<string, number>();

    for (const edge of graph.edges) {
      if (filteredNodes.has(edge.source) && filteredNodes.has(edge.target)) {
        simEdges.push({ source: edge.source, target: edge.target });
        degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
        degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
      }
    }

    const simNodes: SimNode[] = [];
    for (const nodeId of filteredNodes) {
      const originalNode = graph.nodes.get(nodeId);
      const degree = degreeMap.get(nodeId) ?? 0;
      const label =
        originalNode?.label ??
        nodeId.replace(/\.md$/i, "").split("/").pop() ??
        nodeId;

      simNodes.push({
        id: nodeId,
        label,
        degree,
        radius: getNodeRadius(degree),
      });
    }

    return { nodes: simNodes, edges: simEdges };
  }, [graph, mode, activeNotePath]);

  const handleNodeClick = (nodeId: string) => {
    if (onNavigate) {
      onNavigate(nodeId);
    } else {
      useWorkspaceStore.getState().openNote(nodeId);
    }
  };

  const modeControl = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMode(mode === "local" ? "global" : "local")}
      title={mode === "local" ? "Switch to Global Graph" : "Switch to Local Graph"}
      aria-label={mode === "local" ? "Switch to Global Graph" : "Switch to Local Graph"}
    >
      <ShareNetwork size={16} />
    </Button>
  );

  return (
    <div className="graph-view">
      {nodes.length <= 1 && mode === "local" ? (
        <div className="graph-view__empty">
          <EmptyState
            icon={<ShareNetwork size={32} weight="regular" />}
            title="No Connections"
            description="This note isn't linked to any others yet."
          />
        </div>
      ) : nodes.length === 0 && mode === "global" ? (
        <div className="graph-view__empty">
          <EmptyState
            icon={<ShareNetwork size={32} weight="regular" />}
            title="Empty Graph"
            description="No notes found in this vault."
          />
        </div>
      ) : (
        <GraphRenderer
          nodes={nodes}
          edges={edges}
          activeNodeId={activeNotePath}
          onNodeClick={handleNodeClick}
          modeControl={modeControl}
        />
      )}
    </div>
  );
};
