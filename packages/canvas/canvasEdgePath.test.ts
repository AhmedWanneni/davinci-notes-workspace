import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { getCanvasEdgePath } from "./canvasEdgePath";

describe("canvasEdgePath", () => {
  it("uses standard bezier path for forward flow", () => {
    const [path] = getCanvasEdgePath({
      sourceX: 100,
      sourceY: 100,
      sourcePosition: Position.Right,
      targetX: 300,
      targetY: 150,
      targetPosition: Position.Left,
    });
    expect(path).toContain("M100,100");
    expect(path).toContain("300,150");
  });

  it("produces an arched, non-flat curve when an edge backs up horizontally", () => {
    // source is at 300, target is at 100 (backing up)
    const [path, labelX, labelY] = getCanvasEdgePath({
      sourceX: 300,
      sourceY: 100,
      sourcePosition: Position.Right,
      targetX: 100,
      targetY: 100,
      targetPosition: Position.Left,
    });

    expect(path).toContain("M300,100");
    // Standard XYFlow produces C388,100 11.6,100 (flat line with y=100)
    // Our custom path arches in Y (y !== 100 in control points)
    expect(path).not.toBe("M300,100 C388.3883476483185,100 11.611652351681556,100 100,100");
    expect(labelY).not.toBe(100);
    expect(labelX).toBe(200);
  });

  it("produces an arched, non-flat curve when an edge backs up vertically", () => {
    // source is at 300 (bottom), target is at 100 (top)
    const [path, labelX, labelY] = getCanvasEdgePath({
      sourceX: 100,
      sourceY: 300,
      sourcePosition: Position.Bottom,
      targetX: 100,
      targetY: 100,
      targetPosition: Position.Top,
    });

    expect(path).toContain("M100,300");
    expect(labelX).not.toBe(100);
    expect(labelY).toBe(200);
  });
});
