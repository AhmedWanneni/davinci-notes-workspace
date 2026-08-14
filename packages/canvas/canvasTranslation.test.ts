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

    // Verify node properties
    expect(rfState.nodes[0].id).toBe("node-text");
    expect(rfState.nodes[0].position).toEqual({ x: 100, y: 150 });
    expect(rfState.nodes[0].style).toEqual({ width: 300, height: 200 });

    // Verify round-trip conversion
    const roundTrip = reactFlowToJsonCanvas(rfState.nodes, rfState.edges);
    expect(roundTrip).toEqual(fullCanvas);
  });
});
