import React from "react";
import { Typography } from "@app/design-system";
import { GraphIndex } from "@app/indexer";
import { GraphView } from "../GraphView";

interface LocalGraphPanelProps {
  graph: GraphIndex | null;
  activePath: string | null;
  onSelectNote: (path: string) => void;
}

export function LocalGraphPanel({
  graph,
  activePath,
  onSelectNote,
}: LocalGraphPanelProps) {
  return (
    <aside className="local-graph-panel">
      <div className="local-graph-panel__header">
        <Typography variant="h3" size="sm" className="local-graph-panel__title">
          Local Graph
        </Typography>
      </div>

      <div className="local-graph-panel__content">
        {!graph || !activePath ? (
          <div className="local-graph-panel__empty">
            <Typography variant="text" color="muted" size="xs">
              No graph data available
            </Typography>
          </div>
        ) : (
          <GraphView
            graph={graph}
            defaultMode="local"
            onNavigate={onSelectNote}
          />
        )}
      </div>
    </aside>
  );
}
