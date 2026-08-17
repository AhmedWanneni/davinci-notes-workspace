import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
  assignParentsByBbox,
  computeGroupBboxForIds,
  expandSelectionToMembers,
  getNodeDepth,
  getTransitiveChildIds,
  isGroupNode,
  MAX_GROUP_NESTING_DEPTH,
  reparentNodesOnDrop,
  wouldCreateCycle,
} from "./groupContainment";

const mkNode = (
  id: string,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  parent?: string,
): Node => ({
  id,
  type,
  position: { x, y },
  style: { width: w, height: h },
  data: { type },
  ...(parent ? { parentId: parent, extent: "parent" as const } : {}),
});

describe("groupContainment pure functions", () => {
  describe("isGroupNode", () => {
    it("detects group by type field", () => {
      expect(isGroupNode(mkNode("g", "group", 0, 0, 100, 100))).toBe(true);
      expect(isGroupNode(mkNode("t", "text", 0, 0, 100, 100))).toBe(false);
    });

    it("detects group via data.type when node.type missing", () => {
      const n: Node = {
        id: "g",
        position: { x: 0, y: 0 },
        style: { width: 100, height: 100 },
        data: { type: "group" },
      };
      expect(isGroupNode(n)).toBe(true);
    });
  });

  describe("assignParentsByBbox", () => {
    it("leaves standalone nodes unparented when no group contains them", () => {
      const group = mkNode("g", "group", 0, 0, 200, 200);
      const outside = mkNode("t", "text", 300, 300, 100, 100);
      const result = assignParentsByBbox([group, outside]);
      const out = result.find((n) => n.id === "t")!;
      expect(out.parentId).toBeUndefined();
    });

    it("assigns node inside single group as child", () => {
      const group = mkNode("g", "group", 0, 0, 200, 200);
      const inside = mkNode("t", "text", 50, 50, 100, 100);
      const result = assignParentsByBbox([group, inside]);
      const child = result.find((n) => n.id === "t")!;
      expect(child.parentId).toBe("g");
      expect(child.position).toEqual({ x: 50, y: 50 });
    });

    it("picks smallest enclosing group when nested", () => {
      const outer = mkNode("outer", "group", 0, 0, 500, 500);
      const inner = mkNode("inner", "group", 100, 100, 200, 200);
      const card = mkNode("t", "text", 150, 150, 50, 50);
      const result = assignParentsByBbox([outer, inner, card]);
      const child = result.find((n) => n.id === "t")!;
      expect(child.parentId).toBe("inner");
    });

    it("assigns inner group as child of outer group", () => {
      const outer = mkNode("outer", "group", 0, 0, 500, 500);
      const inner = mkNode("inner", "group", 100, 100, 200, 200);
      const result = assignParentsByBbox([outer, inner]);
      const innerNode = result.find((n) => n.id === "inner")!;
      expect(innerNode.parentId).toBe("outer");
    });
  });

  describe("computeGroupBboxForIds", () => {
    it("returns null for empty id list", () => {
      const nodes = [mkNode("t", "text", 10, 20, 100, 100)];
      expect(computeGroupBboxForIds(nodes, [])).toBeNull();
    });

    it("computes bbox with padding for single node", () => {
      const nodes = [mkNode("t", "text", 100, 100, 100, 100)];
      const bbox = computeGroupBboxForIds(nodes, ["t"])!;
      expect(bbox.x).toBeLessThan(100);
      expect(bbox.y).toBeLessThan(100);
      expect(bbox.width).toBeGreaterThan(100);
      expect(bbox.height).toBeGreaterThan(100);
    });

    it("covers multiple nodes with their extents", () => {
      const a = mkNode("a", "text", 0, 0, 50, 50);
      const b = mkNode("b", "text", 200, 200, 50, 50);
      const bbox = computeGroupBboxForIds([a, b], ["a", "b"])!;
      expect(bbox.x).toBeLessThanOrEqual(0);
      expect(bbox.y).toBeLessThanOrEqual(0);
      expect(bbox.x + bbox.width).toBeGreaterThanOrEqual(250);
      expect(bbox.y + bbox.height).toBeGreaterThanOrEqual(250);
    });
  });

  describe("expandSelectionToMembers", () => {
    it("returns unchanged ids when no groups present", () => {
      const nodes = [
        mkNode("a", "text", 0, 0, 10, 10),
        mkNode("b", "text", 0, 0, 10, 10),
      ];
      const result = expandSelectionToMembers(nodes, ["a"]);
      expect(result.sort()).toEqual(["a"]);
    });

    it("includes direct children of selected group", () => {
      const g = mkNode("g", "group", 0, 0, 200, 200);
      const child = mkNode("t", "text", 20, 20, 20, 20, "g");
      const result = expandSelectionToMembers([g, child], ["g"]);
      expect(new Set(result)).toEqual(new Set(["g", "t"]));
    });

    it("transitively includes nested contents", () => {
      const outer = mkNode("outer", "group", 0, 0, 500, 500);
      const inner = mkNode("inner", "group", 20, 20, 200, 200, "outer");
      const card = mkNode("t", "text", 40, 40, 30, 30, "inner");
      const result = expandSelectionToMembers([outer, inner, card], ["outer"]);
      expect(new Set(result)).toEqual(new Set(["outer", "inner", "t"]));
    });
  });

  describe("getTransitiveChildIds", () => {
    it("returns empty for no group children", () => {
      const g = mkNode("g", "group", 0, 0, 100, 100);
      const other = mkNode("t", "text", 200, 200, 50, 50);
      expect(getTransitiveChildIds([g, other], ["g"])).toEqual([]);
    });

    it("returns direct + nested children", () => {
      const outer = mkNode("outer", "group", 0, 0, 500, 500);
      const inner = mkNode("inner", "group", 10, 10, 200, 200, "outer");
      const card = mkNode("t", "text", 20, 20, 30, 30, "inner");
      const sibling = mkNode("s", "text", 300, 300, 30, 30, "outer");
      const ids = new Set(
        getTransitiveChildIds([outer, inner, card, sibling], ["outer"]),
      );
      expect(ids.has("inner")).toBe(true);
      expect(ids.has("t")).toBe(true);
      expect(ids.has("s")).toBe(true);
    });
  });

  describe("getNodeDepth", () => {
    it("is 0 for top-level nodes", () => {
      const g = mkNode("g", "group", 0, 0, 100, 100);
      expect(getNodeDepth([g], "g")).toBe(0);
    });

    it("counts ancestors correctly across nesting", () => {
      const g1 = mkNode("g1", "group", 0, 0, 1000, 1000);
      const g2 = mkNode("g2", "group", 50, 50, 500, 500, "g1");
      const g3 = mkNode("g3", "group", 80, 80, 200, 200, "g2");
      const card = mkNode("t", "text", 100, 100, 50, 50, "g3");
      const nodes = [g1, g2, g3, card];
      expect(getNodeDepth(nodes, "g2")).toBe(1);
      expect(getNodeDepth(nodes, "g3")).toBe(2);
      expect(getNodeDepth(nodes, "t")).toBe(3);
    });
  });

  describe("reparentNodesOnDrop", () => {
    it("reparents a card dropped inside a group with parent-relative position", () => {
      const group = mkNode("g", "group", 100, 100, 400, 300);
      const card = mkNode("t", "text", 200, 200, 100, 100);
      const result = reparentNodesOnDrop([group, card], ["t"]);
      const updated = result.find((n) => n.id === "t")!;
      expect(updated.parentId).toBe("g");
      expect(updated.position).toEqual({ x: 100, y: 100 });
      expect(updated.extent).toBe("parent");
    });

    it("nests a group dropped inside another group", () => {
      const outer = mkNode("outer", "group", 0, 0, 800, 800);
      const inner = mkNode("inner", "group", 300, 300, 200, 200);
      const result = reparentNodesOnDrop([outer, inner], ["inner"]);
      const updated = result.find((n) => n.id === "inner")!;
      expect(updated.parentId).toBe("outer");
      expect(updated.position).toEqual({ x: 300, y: 300 });
    });

    it("leaves nodes unparented when dropped outside all groups", () => {
      const group = mkNode("g", "group", 0, 0, 200, 200);
      const card = mkNode("t", "text", 500, 500, 100, 100);
      const result = reparentNodesOnDrop([group, card], ["t"]);
      expect(result.find((n) => n.id === "t")!.parentId).toBeUndefined();
    });

    it("keeps existing parent when card stays inside it", () => {
      const outer = mkNode("outer", "group", 0, 0, 800, 800);
      const card = mkNode("t", "text", 100, 100, 100, 100, "outer");
      const result = reparentNodesOnDrop([outer, card], ["t"]);
      const updated = result.find((n) => n.id === "t")!;
      expect(updated.parentId).toBe("outer");
      expect(updated.position).toEqual({ x: 100, y: 100 });
    });

    it("reparents a card into a smaller group that now contains its center", () => {
      const outer = mkNode("outer", "group", 0, 0, 800, 800);
      const inner = mkNode("inner", "group", 200, 200, 200, 200, "outer");
      const card = mkNode("t", "text", 250, 250, 100, 100, "outer");
      const result = reparentNodesOnDrop([outer, inner, card], ["t"]);
      expect(result.find((n) => n.id === "t")!.parentId).toBe("inner");
    });

    it("does not reparent children that moved along with their dragged parent", () => {
      const outer = mkNode("outer", "group", 0, 0, 1000, 1000);
      const inner = mkNode("inner", "group", 100, 100, 200, 200, "outer");
      const card = mkNode("t", "text", 150, 150, 50, 50, "inner");
      const result = reparentNodesOnDrop([outer, inner, card], ["inner"]);
      expect(result.find((n) => n.id === "inner")!.parentId).toBe("outer");
      expect(result.find((n) => n.id === "t")!.parentId).toBe("inner");
    });

    it("caps nesting at depth 10 by falling back to the deepest allowed parent", () => {
      const nodes: Node[] = [];
      for (let i = 0; i < 11; i++) {
        const parent = nodes[nodes.length - 1];
        nodes.push(
          mkNode(
            `g${i}`,
            "group",
            100,
            100,
            5000 - i * 400,
            5000 - i * 400,
            parent?.id,
          ),
        );
      }
      const top = mkNode("top", "group", 1050, 1050, 100, 100);
      const result = reparentNodesOnDrop([...nodes, top], ["top"]);
      const updated = result.find((n) => n.id === "top")!;
      expect(getNodeDepth(result, "top")).toBeLessThanOrEqual(
        MAX_GROUP_NESTING_DEPTH,
      );
      expect(updated.parentId).toBe("g9");
    });

    it("rejects nesting a group inside its own descendant", () => {
      const outer = mkNode("outer", "group", 0, 0, 1000, 1000);
      const inner = mkNode("inner", "group", 100, 100, 200, 200, "outer");
      const result = reparentNodesOnDrop([outer, inner], ["outer"]);
      expect(result.find((n) => n.id === "outer")!.parentId).toBeUndefined();
    });

    it("does not assign a smaller group as parent of a larger one", () => {
      const small = mkNode("small", "group", 100, 100, 100, 100);
      const large = mkNode("large", "group", 80, 80, 400, 400);
      const result = reparentNodesOnDrop([small, large], ["large"]);
      expect(result.find((n) => n.id === "large")!.parentId).toBeUndefined();
    });
  });

  describe("wouldCreateCycle", () => {
    it("returns true for self assignment", () => {
      const g = mkNode("g", "group", 0, 0, 100, 100);
      expect(wouldCreateCycle([g], "g", "g")).toBe(true);
    });

    it("returns true when parent is transitive child", () => {
      const outer = mkNode("outer", "group", 0, 0, 500, 500);
      const inner = mkNode("inner", "group", 10, 10, 200, 200, "outer");
      expect(wouldCreateCycle([outer, inner], "outer", "inner")).toBe(true);
    });

    it("returns false for independent nodes", () => {
      const a = mkNode("a", "group", 0, 0, 100, 100);
      const b = mkNode("b", "group", 300, 0, 100, 100);
      expect(wouldCreateCycle([a, b], "a", "b")).toBe(false);
      expect(wouldCreateCycle([a, b], "b", "a")).toBe(false);
    });
  });
});
