import type { Node } from "@xyflow/react";

export type AlignDirection =
  "left" | "right" | "top" | "bottom" | "center-h" | "center-v";

export type DistributeDirection = "horizontal" | "vertical";

interface NodeBounds {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

function getNodeWidth(node: Node): number {
  return (
    (typeof node.style?.width === "number" ? node.style.width : 0) ??
    (typeof node.width === "number" ? node.width : 0) ??
    250
  );
}

function getNodeHeight(node: Node): number {
  return (
    (typeof node.style?.height === "number" ? node.style.height : 0) ??
    (typeof node.height === "number" ? node.height : 0) ??
    150
  );
}

function getNodeBounds(node: Node): NodeBounds {
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);
  const left = node.position.x;
  const top = node.position.y;
  return {
    id: node.id,
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

export function alignNodes(
  nodes: Node[],
  selectedIds: string[],
  direction: AlignDirection,
): Node[] {
  if (selectedIds.length <= 1) return nodes;

  const selected = nodes.filter((n) => selectedIds.includes(n.id));
  const bounds = selected.map(getNodeBounds);

  let targetLeft: number | undefined;
  let targetRight: number | undefined;
  let targetTop: number | undefined;
  let targetBottom: number | undefined;
  let targetCenterX: number | undefined;
  let targetCenterY: number | undefined;

  switch (direction) {
    case "left":
      targetLeft = Math.min(...bounds.map((b) => b.left));
      break;
    case "right":
      targetRight = Math.max(...bounds.map((b) => b.right));
      break;
    case "top":
      targetTop = Math.min(...bounds.map((b) => b.top));
      break;
    case "bottom":
      targetBottom = Math.max(...bounds.map((b) => b.bottom));
      break;
    case "center-h": {
      const minLeft = Math.min(...bounds.map((b) => b.left));
      const maxRight = Math.max(...bounds.map((b) => b.right));
      targetCenterX = (minLeft + maxRight) / 2;
      break;
    }
    case "center-v": {
      const minTop = Math.min(...bounds.map((b) => b.top));
      const maxBottom = Math.max(...bounds.map((b) => b.bottom));
      targetCenterY = (minTop + maxBottom) / 2;
      break;
    }
  }

  const selectedSet = new Set(selectedIds);
  return nodes.map((node) => {
    if (!selectedSet.has(node.id)) return node;
    const b = getNodeBounds(node);
    let { x, y } = node.position;

    if (targetLeft !== undefined) x = targetLeft;
    if (targetRight !== undefined) x = targetRight - b.width;
    if (targetTop !== undefined) y = targetTop;
    if (targetBottom !== undefined) y = targetBottom - b.height;
    if (targetCenterX !== undefined) x = targetCenterX - b.width / 2;
    if (targetCenterY !== undefined) y = targetCenterY - b.height / 2;

    return { ...node, position: { x, y } };
  });
}

export function distributeNodes(
  nodes: Node[],
  selectedIds: string[],
  direction: DistributeDirection,
): Node[] {
  if (selectedIds.length <= 2) return nodes;

  const selected = nodes.filter((n) => selectedIds.includes(n.id));
  const selectedSet = new Set(selectedIds);
  const bounds = selected.map(getNodeBounds);

  if (direction === "horizontal") {
    const sorted = [...bounds].sort((a, b) => a.left - b.left);
    const totalSpan = sorted[sorted.length - 1].right - sorted[0].left;
    const totalWidth = sorted.reduce((sum, b) => sum + b.width, 0);
    const gap = (totalSpan - totalWidth) / (sorted.length - 1);

    const idToNewX = new Map<string, number>();
    let cursor = sorted[0].left;
    for (const b of sorted) {
      idToNewX.set(b.id, cursor);
      cursor += b.width + gap;
    }

    return nodes.map((node) => {
      if (!selectedSet.has(node.id)) return node;
      const newX = idToNewX.get(node.id);
      if (newX === undefined) return node;
      return { ...node, position: { ...node.position, x: newX } };
    });
  } else {
    const sorted = [...bounds].sort((a, b) => a.top - b.top);
    const totalSpan = sorted[sorted.length - 1].bottom - sorted[0].top;
    const totalHeight = sorted.reduce((sum, b) => sum + b.height, 0);
    const gap = (totalSpan - totalHeight) / (sorted.length - 1);

    const idToNewY = new Map<string, number>();
    let cursor = sorted[0].top;
    for (const b of sorted) {
      idToNewY.set(b.id, cursor);
      cursor += b.height + gap;
    }

    return nodes.map((node) => {
      if (!selectedSet.has(node.id)) return node;
      const newY = idToNewY.get(node.id);
      if (newY === undefined) return node;
      return { ...node, position: { ...node.position, y: newY } };
    });
  }
}
