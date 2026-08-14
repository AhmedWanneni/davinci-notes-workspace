import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCanvas, serializeCanvas, validateCanvas } from "./index";

describe("parseCanvas & validateCanvas", () => {
  it("parses empty or missing canvas string into empty arrays", () => {
    expect(parseCanvas("")).toEqual({ nodes: [], edges: [] });
    expect(parseCanvas("{}")).toEqual({ nodes: [], edges: [] });
    expect(parseCanvas('{"nodes": []}')).toEqual({ nodes: [], edges: [] });
  });

  it("parses basic.canvas fixture correctly", () => {
    const fixturePath = path.resolve(__dirname, "fixtures/basic.canvas");
    const content = fs.readFileSync(fixturePath, "utf-8");
    const data = parseCanvas(content);

    expect(data.nodes).toHaveLength(2);
    expect(data.edges).toHaveLength(1);

    const [n1, n2] = data.nodes!;
    expect(n1.type).toBe("text");
    expect(n1.id).toBe("node-1");
    expect(n2.type).toBe("file");
    expect(n2.id).toBe("node-2");

    const [e1] = data.edges!;
    expect(e1.fromNode).toBe("node-1");
    expect(e1.toNode).toBe("node-2");
    expect(e1.toEnd).toBe("arrow");
  });

  it("parses complex.canvas fixture with all node variants", () => {
    const fixturePath = path.resolve(__dirname, "fixtures/complex.canvas");
    const content = fs.readFileSync(fixturePath, "utf-8");
    const data = parseCanvas(content);

    expect(data.nodes).toHaveLength(4);
    expect(data.edges).toHaveLength(2);

    const groupNode = data.nodes?.find((n) => n.type === "group");
    expect(groupNode).toBeDefined();
    if (groupNode && groupNode.type === "group") {
      expect(groupNode.label).toBe("Research Group");
      expect(groupNode.backgroundStyle).toBe("cover");
    }

    const linkNode = data.nodes?.find((n) => n.type === "link");
    expect(linkNode).toBeDefined();
    if (linkNode && linkNode.type === "link") {
      expect(linkNode.url).toBe("https://jsoncanvas.org/spec/1.0/");
    }
  });

  it("throws SyntaxError on malformed JSON", () => {
    expect(() => parseCanvas("{ invalid json")).toThrow(SyntaxError);
  });

  it("throws descriptive error when top-level is not an object", () => {
    expect(() => validateCanvas(["not", "an", "object"])).toThrow(
      /Canvas data must be a top-level JSON object/,
    );
  });

  it("throws when node is missing required id or has invalid type", () => {
    expect(() =>
      validateCanvas({
        nodes: [
          { type: "text", text: "hi", x: 0, y: 0, width: 10, height: 10 },
        ],
      }),
    ).toThrow(/missing a valid string 'id'/);

    expect(() =>
      validateCanvas({
        nodes: [
          { id: "n1", type: "invalidType", x: 0, y: 0, width: 10, height: 10 },
        ],
      }),
    ).toThrow(/unknown type 'invalidType'/);
  });

  it("throws when node coordinates are not numbers", () => {
    expect(() =>
      validateCanvas({
        nodes: [
          {
            id: "n1",
            type: "text",
            text: "hi",
            x: "0",
            y: 0,
            width: 10,
            height: 10,
          },
        ],
      }),
    ).toThrow(/invalid numeric value for 'x'/);
  });

  it("throws when edge has invalid endpoint side or end", () => {
    expect(() =>
      validateCanvas({
        nodes: [],
        edges: [
          {
            id: "e1",
            fromNode: "n1",
            toNode: "n2",
            fromSide: "diagonal" as unknown as "left",
          },
        ],
      }),
    ).toThrow(/invalid 'fromSide'/);
  });

  it("serializes and parses back with identical structure", () => {
    const original = {
      nodes: [
        {
          id: "n1",
          type: "text" as const,
          text: "Serialized text",
          x: 50,
          y: 60,
          width: 200,
          height: 100,
          color: "1",
        },
      ],
      edges: [
        {
          id: "e1",
          fromNode: "n1",
          toNode: "n2",
          toEnd: "arrow" as const,
          label: "link label",
        },
      ],
    };

    const serialized = serializeCanvas(original);
    const parsed = parseCanvas(serialized);
    expect(parsed).toEqual(original);
  });
});
