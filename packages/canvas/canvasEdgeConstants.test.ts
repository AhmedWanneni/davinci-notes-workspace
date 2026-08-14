import { describe, expect, it } from "vitest";
import {
  CANVAS_EDGE_PALETTE,
  createCanvasEdgeId,
  getCanvasEdgeColorCss,
} from "./canvasEdgeConstants";

describe("canvasEdgeConstants", () => {
  it("generates unique edge IDs starting with edge-", () => {
    const id1 = createCanvasEdgeId();
    const id2 = createCanvasEdgeId();
    expect(id1).toMatch(/^edge-[a-f0-9-]+$/);
    expect(id2).toMatch(/^edge-[a-f0-9-]+$/);
    expect(id1).not.toBe(id2);
  });

  it("resolves preset colors and custom hex colors correctly", () => {
    expect(getCanvasEdgeColorCss()).toBe("var(--color-border-normal, #363636)");
    expect(getCanvasEdgeColorCss("1")).toBe("var(--color-text-error, #e55353)");
    expect(getCanvasEdgeColorCss("4")).toBe(
      "var(--color-text-success, #2ecc71)",
    );
    expect(getCanvasEdgeColorCss("6")).toBe(
      "var(--color-interactive-accent, #7f6df2)",
    );
    expect(getCanvasEdgeColorCss("#123456")).toBe("#123456");
  });

  it("defines a palette of 7 token-constrained options", () => {
    expect(CANVAS_EDGE_PALETTE).toHaveLength(7);
    expect(CANVAS_EDGE_PALETTE[0].label).toBe("Default");
    expect(CANVAS_EDGE_PALETTE[1].preset).toBe("1");
    expect(CANVAS_EDGE_PALETTE[6].preset).toBe("6");
  });
});
