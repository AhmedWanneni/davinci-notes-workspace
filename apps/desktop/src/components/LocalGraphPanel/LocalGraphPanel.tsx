import React from "react";
import { Typography } from "@app/design-system";
import { GraphIndex } from "@app/indexer";
import { GraphView } from "../GraphView";
import styles from "./LocalGraphPanel.module.scss";

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
    <aside className={styles["local-graph-panel"]}>
      <div className={styles.header}>
        <Typography variant="h3" size="sm" className={styles.title}>
          Local Graph
        </Typography>
      </div>

      <div className={styles.content}>
        {!graph || !activePath ? (
          <div className={styles["empty-state"]}>
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
