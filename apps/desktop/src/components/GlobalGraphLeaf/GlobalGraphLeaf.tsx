import { useMemo } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import type { GraphIndex } from "@app/indexer";

import { GraphView } from "../GraphView";

const EMPTY_GRAPH: GraphIndex = {
  nodes: new Map(),
  edges: [],
  backlinks: new Map(),
};

export function filterGraphByFolder(
  graph: GraphIndex | null,
  folderPath?: string | null,
  allNotePaths?: readonly string[],
): GraphIndex {
  const source = graph ?? EMPTY_GRAPH;
  const cleanFolder = folderPath?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  if (!cleanFolder) return source;

  const prefix = `${cleanFolder}/`;
  const isInFolder = (path: string) =>
    path === cleanFolder || path.startsWith(prefix);

  const nodes = new Map(
    Array.from(source.nodes.entries()).filter(([id]) => isInFolder(id)),
  );
  if (allNotePaths) {
    for (const notePath of allNotePaths) {
      if (isInFolder(notePath) && !nodes.has(notePath)) {
        const label =
          notePath.replace(/\.(md|canvas)$/i, "").split("/").pop() ?? notePath;
        nodes.set(notePath, { id: notePath, label });
      }
    }
  }
  const edges = source.edges.filter(
    (e) => nodes.has(e.source) && nodes.has(e.target),
  );
  const backlinks = new Map<string, string[]>();
  for (const [target, sources] of source.backlinks.entries()) {
    if (!nodes.has(target)) continue;
    backlinks.set(
      target,
      sources.filter((s) => nodes.has(s)),
    );
  }
  return { nodes, edges, backlinks };
}

interface GlobalGraphLeafProps {
  graph: GraphIndex | null;
  folderFilter?: string | null;
  allNotePaths?: readonly string[];
  onClearFolderFilter?: () => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function GlobalGraphLeaf({
  graph,
  folderFilter,
  allNotePaths,
  onClearFolderFilter,
  onClose,
  onNavigate,
}: GlobalGraphLeafProps) {
  const scopedGraph = useMemo(
    () => filterGraphByFolder(graph, folderFilter, allNotePaths),
    [graph, folderFilter, allNotePaths],
  );
  const cleanFolder = folderFilter?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  const title = cleanFolder ? `Folder Graph: ${cleanFolder}` : "Global Graph";

  return (
    <section className="global-graph-leaf" aria-label="Global graph view">
      <header className="global-graph-leaf__header">
        <h1 className="global-graph-leaf__title">{title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {cleanFolder && onClearFolderFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFolderFilter}
              aria-label="Show full vault graph"
            >
              Show all
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close global graph"
          >
            <X size={16} />
          </Button>
        </div>
      </header>
      <div className="global-graph-leaf__content">
        <GraphView
          graph={scopedGraph}
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
