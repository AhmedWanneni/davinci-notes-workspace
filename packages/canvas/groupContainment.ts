import type { Node } from "@xyflow/react";
import {
  Bounds,
  MAX_GROUP_NESTING_DEPTH,
  containsPoint,
  getAbsoluteBounds,
  getNodeHeight,
  getNodeWidth,
  isGroupNode,
} from "./groupBounds";

export * from "./groupBounds";

export function getNodeDepth(
  nodesOrMap: Node[] | Map<string, Node>,
  nodeId: string,
): number {
  const nodeMap = Array.isArray(nodesOrMap)
    ? new Map(nodesOrMap.map((n) => [n.id, n]))
    : nodesOrMap;

  let depth = 0;
  let currentId: string | undefined = nodeId;
  while (currentId && depth < MAX_GROUP_NESTING_DEPTH + 1) {
    const node = nodeMap.get(currentId);
    if (!node || !node.parentId) break;
    currentId = node.parentId;
    depth++;
  }
  return depth;
}

export function wouldCreateCycle(
  nodesOrMap: Node[] | Map<string, Node>,
  nodeId: string,
  candidateParentId: string,
): boolean {
  if (nodeId === candidateParentId) return true;
  const nodeMap = Array.isArray(nodesOrMap)
    ? new Map(nodesOrMap.map((n) => [n.id, n]))
    : nodesOrMap;

  let currentId: string | undefined = candidateParentId;
  let depth = 0;
  while (currentId && depth < MAX_GROUP_NESTING_DEPTH + 1) {
    if (currentId === nodeId) return true;
    const node = nodeMap.get(currentId);
    if (!node || !node.parentId) break;
    currentId = node.parentId;
    depth++;
  }
  return false;
}

export function assignParentsByBbox(nodes: Node[]): Node[] {
  const withAbs: Array<{ node: Node; abs: Bounds }> = nodes.map((n) => ({
    node: { ...n, parentId: undefined, extent: undefined },
    abs: {
      left: n.position.x,
      top: n.position.y,
      right: n.position.x + getNodeWidth(n),
      bottom: n.position.y + getNodeHeight(n),
      width: getNodeWidth(n),
      height: getNodeHeight(n),
    },
  }));

  const groups = withAbs
    .filter(({ node }) => isGroupNode(node))
    .sort((a, b) => a.abs.width * a.abs.height - b.abs.width * b.abs.height);

  return withAbs.map(({ node, abs }) => {
    const centerX = abs.left + abs.width / 2;
    const centerY = abs.top + abs.height / 2;
    const nodeArea = abs.width * abs.height;
    let bestParent: (typeof groups)[number] | null = null;
    for (const g of groups) {
      if (g.node.id === node.id) continue;
      const gArea = g.abs.width * g.abs.height;
      if (gArea <= nodeArea) continue;
      if (containsPoint(g.abs, centerX, centerY)) {
        bestParent = g;
        break;
      }
    }
    if (!bestParent) return node;
    return {
      ...node,
      parentId: bestParent.node.id,
      position: {
        x: abs.left - bestParent.abs.left,
        y: abs.top - bestParent.abs.top,
      },
      extent: "parent",
    };
  });
}

export function reparentNodesOnDrop(
  nodes: Node[],
  draggedIds: string[],
): Node[] {
  const dragged = new Set(draggedIds);
  if (dragged.size === 0) return nodes;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const withAbs = nodes.map((node) => ({
    node,
    abs: getAbsoluteBounds(node, nodeMap),
  }));
  const byId = new Map(withAbs.map((entry) => [entry.node.id, entry]));

  const hasDraggedAncestor = (nodeId: string): boolean => {
    let currentId: string | undefined = nodeId;
    let depth = 0;
    while (currentId && depth < MAX_GROUP_NESTING_DEPTH) {
      const entry = byId.get(currentId);
      if (!entry?.node.parentId) return false;
      if (dragged.has(entry.node.parentId)) return true;
      currentId = entry.node.parentId;
      depth++;
    }
    return false;
  };

  const groups = withAbs
    .filter(({ node }) => isGroupNode(node))
    .sort((a, b) => a.abs.width * a.abs.height - b.abs.width * b.abs.height);

  return nodes.map((node) => {
    if (!dragged.has(node.id) || hasDraggedAncestor(node.id)) return node;
    const entry = byId.get(node.id)!;
    const centerX = entry.abs.left + entry.abs.width / 2;
    const centerY = entry.abs.top + entry.abs.height / 2;
    const nodeArea = entry.abs.width * entry.abs.height;

    let bestParent: (typeof groups)[number] | null = null;
    for (const group of groups) {
      if (group.node.id === node.id) continue;
      const groupArea = group.abs.width * group.abs.height;
      if (groupArea <= nodeArea) continue;
      if (getNodeDepth(nodeMap, group.node.id) + 1 > MAX_GROUP_NESTING_DEPTH) {
        continue;
      }
      if (wouldCreateCycle(nodeMap, node.id, group.node.id)) continue;
      if (containsPoint(group.abs, centerX, centerY)) {
        bestParent = group;
        break;
      }
    }

    if (!bestParent || bestParent.node.id === node.parentId) return node;
    return {
      ...node,
      parentId: bestParent.node.id,
      position: {
        x: entry.abs.left - bestParent.abs.left,
        y: entry.abs.top - bestParent.abs.top,
      },
      extent: "parent",
    };
  });
}

export function expandSelectionToMembers(
  nodes: Node[],
  selectedIds: string[],
): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId) {
      const list = childrenByParent.get(node.parentId) ?? [];
      list.push(node.id);
      childrenByParent.set(node.parentId, list);
    }
  }

  const result = new Set<string>(selectedIds);
  const queue = [...selectedIds];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = childrenByParent.get(parentId);
    if (children) {
      for (const childId of children) {
        if (!result.has(childId)) {
          result.add(childId);
          queue.push(childId);
        }
      }
    }
  }

  return Array.from(result);
}

export function getTransitiveChildIds(
  nodes: Node[],
  parentIds: string[],
): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId) {
      const list = childrenByParent.get(node.parentId) ?? [];
      list.push(node.id);
      childrenByParent.set(node.parentId, list);
    }
  }

  const result = new Set<string>();
  const queue = [...parentIds];

  while (queue.length > 0) {
    const currentParentId = queue.shift()!;
    const children = childrenByParent.get(currentParentId);
    if (children) {
      for (const childId of children) {
        if (!result.has(childId)) {
          result.add(childId);
          queue.push(childId);
        }
      }
    }
  }

  return Array.from(result);
}
