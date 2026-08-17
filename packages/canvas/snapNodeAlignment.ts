import type { Node } from "@xyflow/react";
import { CANVAS_ALIGN_THRESHOLD } from "./canvasConstants";

export interface NodeBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export function getNodeBounds(node: Node): NodeBounds {
  const width =
    typeof node.style?.width === "number"
      ? node.style.width
      : typeof node.width === "number"
        ? node.width
        : 250;
  const height =
    typeof node.style?.height === "number"
      ? node.style.height
      : typeof node.height === "number"
        ? node.height
        : 120;

  const left = node.position.x;
  const top = node.position.y;

  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

function checkGuideDelta(
  d1: number,
  d2: number,
  d3: number,
  t1: number,
  t2: number,
  t3: number,
  threshold: number,
): number | null {
  const targets = [t1, t2, t3];
  const dragged = [d1, d2, d3];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const delta = targets[j] - dragged[i];
      if (Math.abs(delta) <= threshold) {
        return delta;
      }
    }
  }
  return null;
}

/**
 * Snaps a dragged node's position to align with edges/centers of other nodes.
 * Zero-allocation in inner loops with spatial proximity pre-filtering.
 */
export function snapNodeToAlignment(
  draggedNode: Node,
  otherNodes: Node[],
  threshold = CANVAS_ALIGN_THRESHOLD,
): { x: number; y: number } {
  const dragged = getNodeBounds(draggedNode);
  let { x, y } = draggedNode.position;

  let snappedX = false;
  let snappedY = false;

  for (const other of otherNodes) {
    if (other.id === draggedNode.id) continue;

    // Spatial pre-filter: skip nodes far away from drag target
    if (
      Math.abs(other.position.x - draggedNode.position.x) > 3000 &&
      Math.abs(other.position.y - draggedNode.position.y) > 3000
    ) {
      continue;
    }

    const target = getNodeBounds(other);

    if (!snappedX) {
      const deltaX = checkGuideDelta(
        dragged.left,
        dragged.right,
        dragged.centerX,
        target.left,
        target.right,
        target.centerX,
        threshold,
      );
      if (deltaX !== null) {
        x += deltaX;
        snappedX = true;
      }
    }

    if (!snappedY) {
      const deltaY = checkGuideDelta(
        dragged.top,
        dragged.bottom,
        dragged.centerY,
        target.top,
        target.bottom,
        target.centerY,
        threshold,
      );
      if (deltaY !== null) {
        y += deltaY;
        snappedY = true;
      }
    }

    if (snappedX && snappedY) break;
  }

  return { x, y };
}
