import type { GraphIndex } from "@app/indexer";

/** Return a graph copy without a note, its edges, or backlink references. */
export function removeNoteFromGraph(
  graph: GraphIndex | null,
  path: string,
): GraphIndex | null {
  if (!graph) {
    return null;
  }

  const nodes = new Map(graph.nodes);
  nodes.delete(path);

  const edges = graph.edges.filter(
    (edge) => edge.source !== path && edge.target !== path,
  );
  const backlinks = new Map<string, string[]>();

  for (const [target, sources] of graph.backlinks) {
    if (target === path) {
      continue;
    }
    const nextSources = sources.filter((source) => source !== path);
    if (nextSources.length > 0) {
      backlinks.set(target, nextSources);
    }
  }

  return { nodes, edges, backlinks };
}
