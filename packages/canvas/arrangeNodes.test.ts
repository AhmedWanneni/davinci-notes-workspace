import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { alignNodes, distributeNodes } from "./arrangeNodes";

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
    data: { type: "text", text: id },
  };
}

describe("alignNodes", () => {
  it("returns nodes unchanged when fewer than 2 selected", () => {
    const nodes = [makeNode("a", 0, 0), makeNode("b", 200, 50)];
    expect(alignNodes(nodes, ["a"], "left")).toEqual(nodes);
    expect(alignNodes(nodes, [], "left")).toEqual(nodes);
  });

  it("aligns left edge to leftmost node", () => {
    const nodes = [
      makeNode("a", 50, 0),
      makeNode("b", 0, 100),
      makeNode("c", 150, 200),
    ];
    const result = alignNodes(nodes, ["a", "b", "c"], "left");
    expect(result[0].position.x).toBe(0);
    expect(result[1].position.x).toBe(0);
    expect(result[2].position.x).toBe(0);
    expect(result[0].position.y).toBe(0);
    expect(result[1].position.y).toBe(100);
    expect(result[2].position.y).toBe(200);
  });

  it("aligns right edge to rightmost node", () => {
    const nodes = [
      makeNode("a", 50, 0, 100),
      makeNode("b", 0, 100, 100),
      makeNode("c", 150, 200, 100),
    ];
    const result = alignNodes(nodes, ["a", "b", "c"], "right");
    expect(result[0].position.x).toBe(150);
    expect(result[1].position.x).toBe(150);
    expect(result[2].position.x).toBe(150);
  });

  it("aligns top edge to topmost node", () => {
    const nodes = [
      makeNode("a", 0, 50),
      makeNode("b", 100, 0),
      makeNode("c", 200, 150),
    ];
    const result = alignNodes(nodes, ["a", "b", "c"], "top");
    expect(result[0].position.y).toBe(0);
    expect(result[1].position.y).toBe(0);
    expect(result[2].position.y).toBe(0);
  });

  it("aligns bottom edge to bottommost node", () => {
    const nodes = [
      makeNode("a", 0, 50, 100, 80),
      makeNode("b", 100, 0, 100, 80),
      makeNode("c", 200, 150, 100, 80),
    ];
    const result = alignNodes(nodes, ["a", "b", "c"], "bottom");
    expect(result[0].position.y).toBe(150);
    expect(result[1].position.y).toBe(150);
    expect(result[2].position.y).toBe(150);
  });

  it("centers horizontally on collective bounding box", () => {
    const nodes = [makeNode("a", 0, 0, 100), makeNode("b", 200, 100, 100)];
    const result = alignNodes(nodes, ["a", "b"], "center-h");
    const bboxCenterX = (0 + (200 + 100)) / 2;
    expect(result[0].position.x).toBe(bboxCenterX - 50);
    expect(result[1].position.x).toBe(bboxCenterX - 50);
  });

  it("centers vertically on collective bounding box", () => {
    const nodes = [
      makeNode("a", 0, 0, 100, 80),
      makeNode("b", 100, 200, 100, 80),
    ];
    const result = alignNodes(nodes, ["a", "b"], "center-v");
    const bboxCenterY = (0 + (200 + 80)) / 2;
    expect(result[0].position.y).toBe(bboxCenterY - 40);
    expect(result[1].position.y).toBe(bboxCenterY - 40);
  });

  it("does not move unselected nodes", () => {
    const nodes = [
      makeNode("a", 50, 0),
      makeNode("b", 0, 100),
      makeNode("c", 150, 200),
    ];
    const result = alignNodes(nodes, ["a", "b"], "left");
    expect(result[0].position.x).toBe(0);
    expect(result[1].position.x).toBe(0);
    expect(result[2].position.x).toBe(150);
  });

  it("respects varying node widths on right align", () => {
    const nodes = [makeNode("a", 0, 0, 50), makeNode("b", 0, 100, 200)];
    const result = alignNodes(nodes, ["a", "b"], "right");
    expect(result[0].position.x + 50).toBe(result[1].position.x + 200);
  });
});

describe("distributeNodes", () => {
  it("returns nodes unchanged when fewer than 3 selected", () => {
    const nodes = [
      makeNode("a", 0, 0),
      makeNode("b", 200, 50),
      makeNode("c", 400, 0),
    ];
    expect(distributeNodes(nodes, ["a", "b"], "horizontal")).toEqual(nodes);
    expect(distributeNodes(nodes, [], "horizontal")).toEqual(nodes);
  });

  it("distributes horizontally with equal spacing", () => {
    const nodes = [
      makeNode("left", 0, 0, 100),
      makeNode("mid", 150, 0, 100),
      makeNode("right", 500, 0, 100),
    ];
    const result = distributeNodes(
      nodes,
      ["left", "mid", "right"],
      "horizontal",
    );
    const left = result.find((n) => n.id === "left")!;
    const mid = result.find((n) => n.id === "mid")!;
    const right = result.find((n) => n.id === "right")!;

    expect(left.position.x).toBe(0);
    expect(right.position.x).toBe(500);

    const gap1 = mid.position.x - (left.position.x + 100);
    const gap2 = right.position.x - (mid.position.x + 100);
    expect(Math.round(gap1)).toBe(Math.round(gap2));
  });

  it("distributes vertically with equal spacing", () => {
    const nodes = [
      makeNode("top", 0, 0, 100, 50),
      makeNode("mid", 0, 80, 100, 50),
      makeNode("bottom", 0, 400, 100, 50),
    ];
    const result = distributeNodes(nodes, ["top", "mid", "bottom"], "vertical");
    const top = result.find((n) => n.id === "top")!;
    const mid = result.find((n) => n.id === "mid")!;
    const bottom = result.find((n) => n.id === "bottom")!;

    expect(top.position.y).toBe(0);
    expect(bottom.position.y).toBe(400);

    const gap1 = mid.position.y - (top.position.y + 50);
    const gap2 = bottom.position.y - (mid.position.y + 50);
    expect(Math.round(gap1)).toBe(Math.round(gap2));
  });

  it("does not move unselected nodes during horizontal distribute", () => {
    const nodes = [
      makeNode("a", 0, 0, 100),
      makeNode("b", 150, 0, 100),
      makeNode("c", 500, 0, 100),
      makeNode("d", 999, 0, 100),
    ];
    const result = distributeNodes(nodes, ["a", "b", "c"], "horizontal");
    expect(result[3].position.x).toBe(999);
  });

  it("handles 4+ nodes horizontal distribute", () => {
    const nodes = [
      makeNode("n1", 0, 0, 100),
      makeNode("n2", 100, 0, 100),
      makeNode("n3", 250, 0, 100),
      makeNode("n4", 700, 0, 100),
    ];
    const result = distributeNodes(
      nodes,
      ["n1", "n2", "n3", "n4"],
      "horizontal",
    );
    const positions = [
      result[0].position.x,
      result[1].position.x,
      result[2].position.x,
      result[3].position.x,
    ];
    const gaps = positions.slice(1).map((p, i) => p - (positions[i] + 100));
    const rounded = gaps.map((g) => Math.round(g * 100) / 100);
    expect(rounded[0]).toBe(rounded[1]);
    expect(rounded[1]).toBe(rounded[2]);
  });
});
