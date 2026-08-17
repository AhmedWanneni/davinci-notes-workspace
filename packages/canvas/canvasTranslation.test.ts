import { describe, expect, it } from "vitest";
import type { CanvasData } from "./CanvasData";
import {
  jsonCanvasToReactFlow,
  reactFlowToJsonCanvas,
} from "./canvasTranslation";

describe("canvasTranslation Layer", () => {
  it("translates empty canvas losslessly", () => {
    const emptyCanvas: CanvasData = { nodes: [], edges: [] };
    const rfState = jsonCanvasToReactFlow(emptyCanvas);

    expect(rfState.nodes).toEqual([]);
    expect(rfState.edges).toEqual([]);

    const backToCanvas = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(backToCanvas).toEqual(emptyCanvas);
  });

  it("handles undefined nodes/edges gracefully", () => {
    const undefinedCanvas: CanvasData = {};
    const rfState = jsonCanvasToReactFlow(undefinedCanvas);

    expect(rfState.nodes).toEqual([]);
    expect(rfState.edges).toEqual([]);

    const backToCanvas = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(backToCanvas).toEqual({ nodes: [], edges: [] });
  });

  it("translates all node variants and edges with full structural fidelity", () => {
    const fullCanvas: CanvasData = {
      nodes: [
        {
          id: "node-text",
          type: "text",
          text: "# Sample Note\nContent here",
          x: 100,
          y: 150,
          width: 300,
          height: 200,
          color: "1",
        },
        {
          id: "node-file",
          type: "file",
          file: "Notes/DeepMind.md",
          subpath: "#overview",
          x: 450,
          y: 150,
          width: 320,
          height: 220,
          color: "#7f6df2",
        },
        {
          id: "node-link",
          type: "link",
          url: "https://jsoncanvas.org/spec/1.0/",
          x: 100,
          y: 400,
          width: 280,
          height: 140,
        },
        {
          id: "node-group",
          type: "group",
          label: "Research Topic",
          background: "assets/bg.jpg",
          backgroundStyle: "cover",
          x: 50,
          y: 50,
          width: 800,
          height: 600,
          color: "5",
        },
      ],
      edges: [
        {
          id: "edge-1",
          fromNode: "node-text",
          fromSide: "right",
          fromEnd: "none",
          toNode: "node-file",
          toSide: "left",
          toEnd: "arrow",
          label: "references",
          color: "2",
        },
        {
          id: "edge-2",
          fromNode: "node-text",
          fromSide: "bottom",
          toNode: "node-link",
          toSide: "top",
          toEnd: "arrow",
        },
      ],
    };

    const rfState = jsonCanvasToReactFlow(fullCanvas);
    expect(rfState.nodes).toHaveLength(4);
    expect(rfState.edges).toHaveLength(2);

    const byId = new Map(rfState.nodes.map((n) => [n.id, n]));
    const textNode = byId.get("node-text")!;
    const fileNode = byId.get("node-file")!;
    const linkNode = byId.get("node-link")!;
    const groupNode = byId.get("node-group")!;

    // Group has no parent and absolute (50,50)
    expect(groupNode.parentId).toBeUndefined();
    expect(groupNode.position).toEqual({ x: 50, y: 50 });
    expect(groupNode.style).toEqual({ width: 800, height: 600 });

    // Nodes inside group have parentId + relative positions
    expect(textNode.parentId).toBe("node-group");
    expect(textNode.position).toEqual({ x: 50, y: 100 });
    expect(textNode.style).toEqual({ width: 300, height: 200 });

    expect(fileNode.parentId).toBe("node-group");
    expect(fileNode.position).toEqual({ x: 400, y: 100 });

    expect(linkNode.parentId).toBe("node-group");
    expect(linkNode.position).toEqual({ x: 50, y: 350 });

    // Verify round-trip conversion (positions converted back to absolute, array order preserved)
    const roundTrip = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(roundTrip).toEqual(fullCanvas);
  });

  it("round-trips nested groups with correct absolute⇄relative position conversions", () => {
    const nestedCanvas: CanvasData = {
      nodes: [
        {
          id: "outer",
          type: "group",
          label: "Outer",
          x: 100,
          y: 100,
          width: 800,
          height: 600,
        },
        {
          id: "inner",
          type: "group",
          label: "Inner",
          x: 150,
          y: 150,
          width: 300,
          height: 300,
        },
        {
          id: "card",
          type: "text",
          text: "Deep card",
          x: 200,
          y: 200,
          width: 100,
          height: 100,
        },
      ],
      edges: [],
    };

    const rfState = jsonCanvasToReactFlow(nestedCanvas);
    const byId = new Map(rfState.nodes.map((n) => [n.id, n]));

    // outer: top level, no parent, position preserved
    expect(byId.get("outer")!.parentId).toBeUndefined();
    expect(byId.get("outer")!.position).toEqual({ x: 100, y: 100 });

    // inner: inside outer → relative
    expect(byId.get("inner")!.parentId).toBe("outer");
    expect(byId.get("inner")!.position).toEqual({ x: 50, y: 50 });

    // card: inside inner → relative to inner
    expect(byId.get("card")!.parentId).toBe("inner");
    expect(byId.get("card")!.position).toEqual({ x: 50, y: 50 });

    // round-trip → identical absolute positions and order
    const roundTrip = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(roundTrip).toEqual(nestedCanvas);
  });

  it("round-trips a 10-level deep group chain within the depth cap", () => {
    const nodes: CanvasData["nodes"] = [];
    for (let i = 0; i < 10; i++) {
      nodes.push({
        id: `g${i}`,
        type: "group",
        label: `Level ${i}`,
        x: 10 + i * 10,
        y: 10 + i * 10,
        width: 1000 - i * 100,
        height: 800 - i * 80,
      });
    }
    nodes.push({
      id: "deep",
      type: "text",
      text: "Deepest",
      x: 110,
      y: 110,
      width: 50,
      height: 50,
    });
    const deep: CanvasData = { nodes, edges: [] };

    const rfState = jsonCanvasToReactFlow(deep);
    // Deepest card inside innermost group
    const deepCard = rfState.nodes.find((n) => n.id === "deep")!;
    expect(deepCard.parentId).toBe("g9");
    // Round trip → absolute positions identical
    const roundTrip = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(roundTrip).toEqual(deep);
  });
});
