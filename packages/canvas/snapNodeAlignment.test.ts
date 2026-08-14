import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { getNodeBounds, snapNodeToAlignment } from "./snapNodeAlignment";

function makeNode(
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 80,
): Node {
  return {
    id,
    type: "text",
    position: { x, y },
    style: { width, height },
    data: { text: "" },
  };
}

describe("snapNodeAlignment", () => {
  it("computes node bounds from style dimensions", () => {
    const bounds = getNodeBounds(makeNode("a", 10, 20, 200, 100));
    expect(bounds).toEqual({
      left: 10,
      right: 210,
      top: 20,
      bottom: 120,
      centerX: 110,
      centerY: 70,
    });
  });

  it("snaps left edge to another node's left edge", () => {
    const dragged = makeNode("drag", 103, 50);
    const other = makeNode("other", 100, 200);
    const snapped = snapNodeToAlignment(dragged, [other], 8);
    expect(snapped.x).toBe(100);
    expect(snapped.y).toBe(50);
  });

  it("snaps top-left corner to another node's top-left corner", () => {
    const dragged = makeNode("drag", 52, 42, 100, 80);
    const other = makeNode("other", 50, 40, 100, 80);
    const snapped = snapNodeToAlignment(dragged, [other], 8);
    expect(snapped.x).toBe(50);
    expect(snapped.y).toBe(40);
  });

  it("ignores self when aligning", () => {
    const node = makeNode("solo", 50, 50);
    const snapped = snapNodeToAlignment(node, [node], 8);
    expect(snapped).toEqual({ x: 50, y: 50 });
  });
});
