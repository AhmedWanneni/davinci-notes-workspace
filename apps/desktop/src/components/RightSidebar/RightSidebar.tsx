import React, { Suspense } from "react";
import type { GraphIndex } from "@app/indexer";
import { BacklinksPanel } from "../BacklinksPanel";
import styles from "../../App.module.scss";

const LazyLocalGraphPanel = React.lazy(() =>
  import("../LocalGraphPanel").then((m) => ({ default: m.LocalGraphPanel })),
);

export interface RightSidebarProps {
  graph: GraphIndex | null;
  activePath: string | null;
  onSelectNote: (path: string) => void;
}

export function RightSidebar({
  graph,
  activePath,
  onSelectNote,
}: RightSidebarProps) {
  return (
    <aside className={styles["right-sidebar"]}>
      <Suspense fallback={null}>
        <LazyLocalGraphPanel
          graph={graph}
          activePath={activePath}
          onSelectNote={onSelectNote}
        />
      </Suspense>
      <BacklinksPanel activePath={activePath} onSelectNote={onSelectNote} />
    </aside>
  );
}
