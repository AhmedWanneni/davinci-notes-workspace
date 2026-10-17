import { getVaultIndexDb, withDbLock } from "../database";

export const MAX_LOCAL_GRAPH_NODES = 50;

export interface LocalGraphNode {
  id: string;
  label: string;
  isCenter: boolean;
  hop: number;
  x: number;
  y: number;
}

export interface LocalGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface LocalGraphData {
  nodes: LocalGraphNode[];
  edges: LocalGraphEdge[];
  totalConnectedCount: number;
  isTruncated: boolean;
}

/**
 * Computes radial layout positions for nodes around the center note.
 */
export function computeGraphLayout(
  nodes: Omit<LocalGraphNode, "x" | "y">[],
  width = 360,
  height = 360,
): LocalGraphNode[] {
  const centerX = width / 2;
  const centerY = height / 2;

  const hop1Nodes = nodes.filter((n) => n.hop === 1);
  const hop2Nodes = nodes.filter((n) => n.hop === 2);

  const radius1 = Math.min(width, height) * 0.32;
  const radius2 = Math.min(width, height) * 0.44;

  const positioned: LocalGraphNode[] = [];

  for (const node of nodes) {
    if (node.isCenter) {
      positioned.push({ ...node, x: centerX, y: centerY });
    }
  }

  hop1Nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, hop1Nodes.length);
    positioned.push({
      ...node,
      x: centerX + radius1 * Math.cos(angle),
      y: centerY + radius1 * Math.sin(angle),
    });
  });

  hop2Nodes.forEach((node, i) => {
    const angle =
      (2 * Math.PI * i) / Math.max(1, hop2Nodes.length) +
      Math.PI / hop2Nodes.length;
    positioned.push({
      ...node,
      x: centerX + radius2 * Math.cos(angle),
      y: centerY + radius2 * Math.sin(angle),
    });
  });

  return positioned;
}

/**
 * Queries SQLite database under withDbLock to construct local N-hop graph.
 */
export async function buildLocalGraph(
  centerPath: string,
  depth = 1,
  maxNodes = MAX_LOCAL_GRAPH_NODES,
): Promise<LocalGraphData> {
  const db = await getVaultIndexDb();

  return withDbLock(async () => {
    const cleanCenter = centerPath.replace(/^\/+/, "");
    const centerStem =
      cleanCenter.replace(/\.md$/, "").split("/").pop() ?? cleanCenter;

    // 1. Fetch 1-hop outgoing and incoming links
    const outRows = await db.getAllAsync<{ target_path: string }>(
      "SELECT DISTINCT target_path FROM links WHERE source_path = ? AND target_path IS NOT NULL AND resolved = 1",
      [cleanCenter],
    );
    const inRows = await db.getAllAsync<{ source_path: string }>(
      "SELECT DISTINCT source_path FROM links WHERE target_path = ?",
      [cleanCenter],
    );

    const hop1Set = new Set<string>();
    for (const r of outRows)
      if (r.target_path !== cleanCenter) hop1Set.add(r.target_path);
    for (const r of inRows)
      if (r.source_path !== cleanCenter) hop1Set.add(r.source_path);

    const totalConnectedCount = hop1Set.size;
    const isTruncated = totalConnectedCount > maxNodes - 1;

    // Sort neighbors deterministically and cap to (maxNodes - 1)
    const sortedHop1 = Array.from(hop1Set)
      .sort()
      .slice(0, maxNodes - 1);

    const rawNodes: Omit<LocalGraphNode, "x" | "y">[] = [
      { id: cleanCenter, label: centerStem, isCenter: true, hop: 0 },
    ];
    const edges: LocalGraphEdge[] = [];

    for (const neighbor of sortedHop1) {
      const neighborStem =
        neighbor.replace(/\.md$/, "").split("/").pop() ?? neighbor;
      rawNodes.push({
        id: neighbor,
        label: neighborStem,
        isCenter: false,
        hop: 1,
      });
      edges.push({
        id: `${cleanCenter}->${neighbor}`,
        source: cleanCenter,
        target: neighbor,
      });
    }

    // 2. If depth === 2 and capacity remains, fetch 2-hop links
    if (depth > 1 && rawNodes.length < maxNodes) {
      for (const neighbor of sortedHop1) {
        if (rawNodes.length >= maxNodes) break;
        const subOut = await db.getAllAsync<{ target_path: string }>(
          "SELECT DISTINCT target_path FROM links WHERE source_path = ? AND target_path IS NOT NULL AND resolved = 1 LIMIT 5",
          [neighbor],
        );
        for (const sub of subOut) {
          if (rawNodes.length >= maxNodes) break;
          if (
            sub.target_path !== cleanCenter &&
            !hop1Set.has(sub.target_path)
          ) {
            const subStem =
              sub.target_path.replace(/\.md$/, "").split("/").pop() ??
              sub.target_path;
            rawNodes.push({
              id: sub.target_path,
              label: subStem,
              isCenter: false,
              hop: 2,
            });
            edges.push({
              id: `${neighbor}->${sub.target_path}`,
              source: neighbor,
              target: sub.target_path,
            });
          }
        }
      }
    }

    const nodes = computeGraphLayout(rawNodes);

    return {
      nodes,
      edges,
      totalConnectedCount,
      isTruncated,
    };
  });
}
