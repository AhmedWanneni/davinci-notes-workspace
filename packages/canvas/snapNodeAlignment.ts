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

/**
 * Snaps a dragged node's position to align with edges/centers of other nodes.
 */
export function snapNodeToAlignment(
  draggedNode: Node,
  otherNodes: Node[],
  threshold = CANVAS_ALIGN_THRESHOLD,
): { x: number; y: number } {
  const dragged = getNodeBounds(draggedNode);
  let { x, y } = draggedNode.position;

  for (const other of otherNodes) {
    if (other.id === draggedNode.id) continue;

    const target = getNodeBounds(other);
    const xGuides = [
      { dragged: dragged.left, target: target.left },
      { dragged: dragged.left, target: target.right },
      { dragged: dragged.left, target: target.centerX },
      { dragged: dragged.right, target: target.left },
      { dragged: dragged.right, target: target.right },
      { dragged: dragged.right, target: target.centerX },
      { dragged: dragged.centerX, target: target.left },
      { dragged: dragged.centerX, target: target.right },
      { dragged: dragged.centerX, target: target.centerX },
    ];

    for (const guide of xGuides) {
      const delta = guide.target - guide.dragged;
      if (Math.abs(delta) <= threshold) {
        x += delta;
        break;
      }
    }

    const yGuides = [
      { dragged: dragged.top, target: target.top },
      { dragged: dragged.top, target: target.bottom },
      { dragged: dragged.top, target: target.centerY },
      { dragged: dragged.bottom, target: target.top },
      { dragged: dragged.bottom, target: target.bottom },
      { dragged: dragged.bottom, target: target.centerY },
      { dragged: dragged.centerY, target: target.top },
      { dragged: dragged.centerY, target: target.bottom },
      { dragged: dragged.centerY, target: target.centerY },
    ];

    for (const guide of yGuides) {
      const delta = guide.target - guide.dragged;
      if (Math.abs(delta) <= threshold) {
        y += delta;
        break;
      }
    }
  }

  return { x, y };
}
