import React, { useMemo, useState } from "react";
import { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { GraphRenderer, SimNode, SimEdge } from "./GraphRenderer";
import { EmptyState } from "../EmptyState";
import { ShareNetwork } from "@phosphor-icons/react";
import styles from "./GraphView.module.scss";
import { Button } from "@app/design-system";

export interface GraphViewProps {
  graph: GraphIndex;
  defaultMode?: "local" | "global";
  onNavigate?: (path: string) => void;
}

const GLOBAL_NODE_LIMIT = 200;

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
      // Local graph: active note + direct connections
      filteredNodes.add(activeNotePath);

      // Add outlinks (edges where source is activeNotePath)
      for (const edge of graph.edges) {
        if (edge.source === activeNotePath) {
          filteredNodes.add(edge.target);
        } else if (edge.target === activeNotePath) {
          filteredNodes.add(edge.source);
        }
      }
    } else if (mode === "global" || (mode === "local" && !activeNotePath)) {
      // Global graph: limit nodes to prevent SVG choking
      const degrees = new Map<string, number>();

      for (const edge of graph.edges) {
        degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
      }

      // Sort nodes by degree descending
      const sortedNodeIds = Array.from(graph.nodes.keys()).sort(
        (a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0),
      );

      // Take top N
      const topNodes = sortedNodeIds.slice(0, GLOBAL_NODE_LIMIT);
      filteredNodes = new Set(topNodes);
    }

    // Build the final arrays for D3
    // D3 mutates these objects, so we MUST create deep copies of the nodes/edges
    const simNodes: SimNode[] = [];
    const simEdges: SimEdge[] = [];

    for (const nodeId of filteredNodes) {
      const originalNode = graph.nodes.get(nodeId);
      if (originalNode) {
        simNodes.push({ id: originalNode.id, label: originalNode.label });
      } else {
        // Fallback for missing nodes in the map
        simNodes.push({
          id: nodeId,
          label: nodeId.replace(/\.md$/i, "").split("/").pop() ?? nodeId,
        });
      }
    }

    for (const edge of graph.edges) {
      if (filteredNodes.has(edge.source) && filteredNodes.has(edge.target)) {
        simEdges.push({ source: edge.source, target: edge.target });
      }
    }

    return { nodes: simNodes, edges: simEdges };
  }, [graph, mode, activeNotePath]);

  const handleNodeClick = (nodeId: string) => {
    if (onNavigate) {
      onNavigate(nodeId);
    } else {
      // Default behavior: open the note in the workspace
      useWorkspaceStore.getState().openNote(nodeId);
    }
  };

  return (
    <div className={styles.graphContainer}>
      {nodes.length <= 1 && mode === "local" ? (
        <div className={"empty-state-container"}>
          <EmptyState
            icon={<ShareNetwork size={32} weight="regular" />}
            title="No Connections"
            description="This note isn't linked to any others yet."
          />
        </div>
      ) : (
        <GraphRenderer
          nodes={nodes}
          edges={edges}
          activeNodeId={activeNotePath}
          onNodeClick={handleNodeClick}
        />
      )}
      <div className={styles.zoomControls}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMode(mode === "local" ? "global" : "local")}
        >
          {mode === "local" ? "Show Global Graph" : "Show Local Graph"}
        </Button>
      </div>
    </div>
  );
};
