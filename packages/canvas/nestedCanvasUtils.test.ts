import { describe, expect, it } from "vitest";
import {
  checkNestingLimit,
  detectCanvasCycle,
  MAX_CANVAS_NESTING_DEPTH,
  normalizeCanvasPath,
  validateNestedCanvas,
} from "./nestedCanvasUtils";

describe("nestedCanvasUtils", () => {
  describe("normalizeCanvasPath", () => {
    it("trims, removes leading/trailing slashes, and lowercases", () => {
      expect(normalizeCanvasPath("  /Notes/Canvas1.canvas/ ")).toBe(
        "notes/canvas1.canvas",
      );
      expect(normalizeCanvasPath("\\boards\\Project.canvas\\")).toBe(
        "boards\\project.canvas",
      );
    });

    it("handles empty or falsy paths", () => {
      expect(normalizeCanvasPath("")).toBe("");
    });
  });

  describe("detectCanvasCycle", () => {
    it("detects direct self-reference (A embeds A)", () => {
      const result = detectCanvasCycle("alpha.canvas", ["alpha.canvas"]);
      expect(result.isCycle).toBe(true);
      expect(result.cycleChain).toEqual(["alpha.canvas", "alpha.canvas"]);
    });

    it("detects indirect cycle (A -> B -> A)", () => {
      const result = detectCanvasCycle("alpha.canvas", [
        "alpha.canvas",
        "beta.canvas",
      ]);
      expect(result.isCycle).toBe(true);
      expect(result.cycleChain).toEqual([
        "alpha.canvas",
        "beta.canvas",
        "alpha.canvas",
      ]);
    });

    it("detects deeper indirect cycle (A -> B -> C -> B)", () => {
      const result = detectCanvasCycle("beta.canvas", [
        "alpha.canvas",
        "beta.canvas",
        "gamma.canvas",
      ]);
      expect(result.isCycle).toBe(true);
      expect(result.cycleChain).toEqual([
        "beta.canvas",
        "gamma.canvas",
        "beta.canvas",
      ]);
    });

    it("returns false for valid acyclic path", () => {
      const result = detectCanvasCycle("gamma.canvas", [
        "alpha.canvas",
        "beta.canvas",
      ]);
      expect(result.isCycle).toBe(false);
      expect(result.cycleChain).toBeUndefined();
    });

    it("performs case-insensitive cycle detection", () => {
      const result = detectCanvasCycle("Alpha.canvas", ["alpha.canvas"]);
      expect(result.isCycle).toBe(true);
    });
  });

  describe("checkNestingLimit", () => {
    it("returns false when depth is under max cap", () => {
      expect(checkNestingLimit([])).toBe(false);
      expect(checkNestingLimit(["A.canvas"])).toBe(false);
      expect(checkNestingLimit(["A.canvas", "B.canvas"])).toBe(false);
    });

    it("returns true when depth meets or exceeds max cap", () => {
      expect(checkNestingLimit(["A", "B", "C"], MAX_CANVAS_NESTING_DEPTH)).toBe(
        true,
      );
      expect(
        checkNestingLimit(["A", "B", "C", "D"], MAX_CANVAS_NESTING_DEPTH),
      ).toBe(true);
    });
  });

  describe("validateNestedCanvas", () => {
    it("validates legitimate moderate-depth acyclic canvas", () => {
      const result = validateNestedCanvas("gamma.canvas", [
        "alpha.canvas",
        "beta.canvas",
      ]);
      expect(result.valid).toBe(true);
    });

    it("identifies cycles before checking depth limit", () => {
      const result = validateNestedCanvas("alpha.canvas", [
        "alpha.canvas",
        "beta.canvas",
        "gamma.canvas",
      ]);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("cycle");
      }
    });

    it("identifies depth limit exceeded on long non-cyclic chains", () => {
      const result = validateNestedCanvas("delta.canvas", [
        "alpha.canvas",
        "beta.canvas",
        "gamma.canvas",
      ]);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("depth_limit");
        if (result.reason === "depth_limit") {
          expect(result.currentDepth).toBe(3);
          expect(result.maxDepth).toBe(3);
        }
      }
    });
  });
});
