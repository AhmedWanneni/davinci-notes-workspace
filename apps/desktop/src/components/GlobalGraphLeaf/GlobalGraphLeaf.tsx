import { X } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import type { GraphIndex } from "@app/indexer";

import { GraphView } from "../GraphView";

const EMPTY_GRAPH: GraphIndex = {
  nodes: new Map(),
  edges: [],
  backlinks: new Map(),
};

interface GlobalGraphLeafProps {
  graph: GraphIndex | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function GlobalGraphLeaf({
  graph,
  onClose,
  onNavigate,
}: GlobalGraphLeafProps) {
  return (
    <section className="global-graph-leaf" aria-label="Global graph view">
      <header className="global-graph-leaf__header">
        <h1 className="global-graph-leaf__title">Global Graph</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close global graph"
        >
          <X size={16} />
        </Button>
      </header>
      <div className="global-graph-leaf__content">
        <GraphView
          graph={graph ?? EMPTY_GRAPH}
          defaultMode="global"
          onNavigate={(path) => {
            onNavigate(path);
            onClose();
          }}
        />
      </div>
    </section>
  );
}
