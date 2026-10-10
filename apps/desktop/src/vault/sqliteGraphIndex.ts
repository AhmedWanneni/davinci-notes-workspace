import type { GraphIndex } from "@app/indexer";
import type Database from "@tauri-apps/plugin-sql";

export async function queryFullGraphIndex(db: Database): Promise<GraphIndex> {
  const nodes = await db.select<{ path: string; title: string }[]>(
    "SELECT path, title FROM notes",
  );

  const links = await db.select<{ source_path: string; target_path: string }[]>(
    "SELECT source_path, target_path FROM links WHERE resolved = 1",
  );

  const graph: GraphIndex = {
    nodes: new Map(),
    edges: [],
    backlinks: new Map(),
  };

  for (const n of nodes) {
    graph.nodes.set(n.path, { id: n.path, label: n.title });
  }

  for (const l of links) {
    graph.edges.push({ source: l.source_path, target: l.target_path });

    if (!graph.nodes.has(l.target_path)) {
      graph.nodes.set(l.target_path, {
        id: l.target_path,
        label:
          l.target_path.replace(/\.md$/i, "").split("/").pop() ?? l.target_path,
      });
    }
  }

  return graph;
}
