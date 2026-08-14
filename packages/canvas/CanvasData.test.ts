import { describe, expect, it } from "vitest";
import {
  isCanvasColor,
  isHexColor,
  isPresetColor,
  type CanvasData,
  type CanvasEdge,
  type CanvasFileNode,
  type CanvasGroupNode,
  type CanvasLinkNode,
  type CanvasTextNode,
} from "./index";

describe("CanvasData & Models", () => {
  it("validates preset and hex colors correctly", () => {
    expect(isPresetColor("1")).toBe(true);
    expect(isPresetColor("6")).toBe(true);
    expect(isPresetColor("7")).toBe(false);
    expect(isPresetColor("red")).toBe(false);

    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#1e1e1e")).toBe(true);
    expect(isHexColor("#7f6df280")).toBe(true);
    expect(isHexColor("1e1e1e")).toBe(false);
    expect(isHexColor("#gggggg")).toBe(false);

    expect(isCanvasColor("3")).toBe(true);
    expect(isCanvasColor("#2ecc71")).toBe(true);
    expect(isCanvasColor("invalid")).toBe(false);
    expect(isCanvasColor(null)).toBe(false);
  });

  it("constructs text node correctly", () => {
    const textNode: CanvasTextNode = {
      id: "text-1",
      type: "text",
      text: "# Hello World",
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      color: "1",
    };
    expect(textNode.type).toBe("text");
    expect(textNode.text).toBe("# Hello World");
  });

  it("constructs file node with subpath correctly", () => {
    const fileNode: CanvasFileNode = {
      id: "file-1",
      type: "file",
      file: "Notes/Concepts.md",
      subpath: "#summary",
      x: 250,
      y: 20,
      width: 300,
      height: 200,
      color: "#ff8800",
    };
    expect(fileNode.type).toBe("file");
    expect(fileNode.file).toBe("Notes/Concepts.md");
    expect(fileNode.subpath).toBe("#summary");
  });

  it("constructs link node correctly", () => {
    const linkNode: CanvasLinkNode = {
      id: "link-1",
      type: "link",
      url: "https://jsoncanvas.org",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    };
    expect(linkNode.type).toBe("link");
    expect(linkNode.url).toBe("https://jsoncanvas.org");
  });

  it("constructs group node with background style correctly", () => {
    const groupNode: CanvasGroupNode = {
      id: "group-1",
      type: "group",
      label: "Main Research",
      background: "images/canvas-bg.png",
      backgroundStyle: "cover",
      x: -50,
      y: -50,
      width: 800,
      height: 600,
      color: "4",
    };
    expect(groupNode.type).toBe("group");
    expect(groupNode.label).toBe("Main Research");
    expect(groupNode.backgroundStyle).toBe("cover");
  });

  it("constructs edge with directional endpoints and labels", () => {
    const edge: CanvasEdge = {
      id: "edge-1",
      fromNode: "text-1",
      fromSide: "right",
      fromEnd: "none",
      toNode: "file-1",
      toSide: "left",
      toEnd: "arrow",
      label: "relates to",
      color: "2",
    };
    expect(edge.fromNode).toBe("text-1");
    expect(edge.toNode).toBe("file-1");
    expect(edge.toEnd).toBe("arrow");
    expect(edge.label).toBe("relates to");
  });

  it("constructs a full CanvasData object", () => {
    const canvas: CanvasData = {
      nodes: [
        {
          id: "n1",
          type: "text",
          text: "Node 1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
      edges: [
        {
          id: "e1",
          fromNode: "n1",
          toNode: "n2",
        },
      ],
    };
    expect(canvas.nodes).toHaveLength(1);
    expect(canvas.edges).toHaveLength(1);
  });
});
