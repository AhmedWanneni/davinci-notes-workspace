import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CanvasData } from "./CanvasData";
import { readCanvasFile, writeCanvasFile } from "./canvasIO";

describe("canvasIO Round-Trip", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "canvas-io-test-"));
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it("writes CanvasData to disk and reads it back with exact structural equality", async () => {
    const testFilePath = path.join(tempDir, "roundtrip.canvas");

    const originalCanvas: CanvasData = {
      nodes: [
        {
          id: "text-card-1",
          type: "text",
          text: "# Roundtrip Test\nTesting file I/O persistence.",
          x: 120,
          y: 80,
          width: 320,
          height: 200,
          color: "1",
        },
        {
          id: "file-card-1",
          type: "file",
          file: "Notes/DeepMind.md",
          subpath: "#findings",
          x: 500,
          y: 80,
          width: 280,
          height: 190,
          color: "#7f6df2",
        },
        {
          id: "link-card-1",
          type: "link",
          url: "https://jsoncanvas.org",
          x: 120,
          y: 320,
          width: 320,
          height: 150,
          color: "3",
        },
        {
          id: "group-card-1",
          type: "group",
          label: "Container Group",
          background: "assets/diagram.png",
          backgroundStyle: "ratio",
          x: 50,
          y: 20,
          width: 800,
          height: 500,
          color: "5",
        },
      ],
      edges: [
        {
          id: "edge-1",
          fromNode: "text-card-1",
          fromSide: "right",
          fromEnd: "none",
          toNode: "file-card-1",
          toSide: "left",
          toEnd: "arrow",
          label: "references",
          color: "4",
        },
        {
          id: "edge-2",
          fromNode: "text-card-1",
          fromSide: "bottom",
          fromEnd: "none",
          toNode: "link-card-1",
          toSide: "top",
          toEnd: "arrow",
          label: "external link",
        },
      ],
    };

    // 1. Write to disk
    await writeCanvasFile(testFilePath, originalCanvas);

    // Verify file actually exists on disk and is non-empty
    const rawFileContent = await fs.readFile(testFilePath, "utf-8");
    expect(rawFileContent.length).toBeGreaterThan(0);

    // 2. Read back from disk
    const readBackCanvas = await readCanvasFile(testFilePath);

    // 3. Confirm exact structural equality
    expect(readBackCanvas).toEqual(originalCanvas);
    expect(readBackCanvas.nodes).toHaveLength(4);
    expect(readBackCanvas.edges).toHaveLength(2);
    expect(readBackCanvas.nodes?.[0].id).toBe("text-card-1");
    expect(readBackCanvas.edges?.[0].label).toBe("references");
  });
});
