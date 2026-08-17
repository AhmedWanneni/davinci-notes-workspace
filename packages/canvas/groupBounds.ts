import type { Node } from "@xyflow/react";

export const MAX_GROUP_NESTING_DEPTH = 10;
export const GROUP_PADDING = 24;
export const GROUP_LABEL_HEIGHT = 40;

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function getNodeWidth(node: Node): number {
  return (
    (typeof node.style?.width === "number" ? node.style.width : 0) ??
    (typeof node.width === "number" ? node.width : 0) ??
    250
  );
}

export function getNodeHeight(node: Node): number {
  return (
    (typeof node.style?.height === "number" ? node.style.height : 0) ??
    (typeof node.height === "number" ? node.height : 0) ??
    150
  );
}

export function isGroupNode(node: Node): boolean {
  return (
    node.type === "group" ||
    (node.data && (node.data as { type?: unknown }).type === "group")
  );
}

export function getAbsoluteBounds(
  node: Node,
  nodesOrMap: Node[] | Map<string, Node>,
): Bounds {
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  let depth = 0;

  const nodeMap = Array.isArray(nodesOrMap)
    ? null
    : nodesOrMap;

  while (parentId && depth < MAX_GROUP_NESTING_DEPTH) {
    const parent = nodeMap
      ? nodeMap.get(parentId)
      : (nodesOrMap as Node[]).find((n) => n.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
    depth++;
  }

  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
  };
}

export function containsPoint(container: Bounds, px: number, py: number): boolean {
  return (
    px >= container.left &&
    px < container.right &&
    py >= container.top &&
    py < container.bottom
  );
}

export function computeGroupBboxForIds(
  nodes: Node[],
  ids: string[],
): { x: number; y: number; width: number; height: number } | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const targets = ids.map((id) => nodeMap.get(id)).filter((n): n is Node => !!n);
  if (targets.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  for (const target of targets) {
    const b = getAbsoluteBounds(target, nodeMap);
    if (b.left < minX) minX = b.left;
    if (b.top < minY) minY = b.top;
    if (b.right > maxRight) maxRight = b.right;
    if (b.bottom > maxBottom) maxBottom = b.bottom;
  }

  return {
    x: minX - GROUP_PADDING,
    y: minY - GROUP_LABEL_HEIGHT,
    width: maxRight - minX + GROUP_PADDING * 2,
    height: maxBottom - minY + GROUP_PADDING + GROUP_LABEL_HEIGHT,
  };
}
