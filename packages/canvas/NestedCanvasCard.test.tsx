import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { NestedCanvasCardView } from "./NestedCanvasCardView";

describe("NestedCanvasCard — Cycle Prevention & Recursion Verification", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    cleanup();
  });

  // 1. Direct Self-Reference: Canvas A embeds Canvas A
  it("Verification 1: prevents direct self-reference (A embeds A) and shows circular reference state", () => {
    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          ancestorCanvasPaths: ["alpha.canvas"],
          notesContent: {
            "alpha.canvas": JSON.stringify({
              nodes: [
                {
                  id: "file-self",
                  type: "file",
                  file: "alpha.canvas",
                  x: 0,
                  y: 0,
                  width: 400,
                  height: 300,
                },
              ],
              edges: [],
            }),
          },
        }}
      >
        <NestedCanvasCardView filePath="alpha.canvas" />
      </CanvasEditorContext.Provider>,
    );

    expect(screen.getByTestId("nested-canvas-cycle-error")).toBeDefined();
    expect(screen.getByText("Circular reference detected")).toBeDefined();
    expect(screen.getByText("alpha.canvas ➔ alpha.canvas")).toBeDefined();
    // Confirms no nested flow was mounted that would trigger infinite recursion
    expect(screen.queryByTestId("nested-canvas-flow")).toBeNull();
  });

  // 2. Indirect Cycle: Canvas A embeds Canvas B, Canvas B embeds Canvas A
  it("Verification 2: prevents indirect cycle (A -> B -> A) and shows circular reference state", () => {
    // Current ancestor chain represents [A, B] trying to render A again
    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          ancestorCanvasPaths: ["alpha.canvas", "beta.canvas"],
          notesContent: {
            "alpha.canvas": JSON.stringify({
              nodes: [
                {
                  id: "card-1",
                  type: "text",
                  text: "Root Canvas",
                  x: 0,
                  y: 0,
                  width: 200,
                  height: 150,
                },
              ],
              edges: [],
            }),
          },
        }}
      >
        <NestedCanvasCardView filePath="alpha.canvas" />
      </CanvasEditorContext.Provider>,
    );

    expect(screen.getByTestId("nested-canvas-cycle-error")).toBeDefined();
    expect(screen.getByText("Circular reference detected")).toBeDefined();
    expect(
      screen.getByText("alpha.canvas ➔ beta.canvas ➔ alpha.canvas"),
    ).toBeDefined();
    expect(screen.queryByTestId("nested-canvas-flow")).toBeNull();
  });

  // 3. Long Non-Cyclic Chain Exceeding Depth Cap (A -> B -> C -> D past depth cap 3)
  it("Verification 3: halts long non-cyclic chains at max depth cap (3 levels) independently of cycle detection", () => {
    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          // Ancestor chain already at depth 3: [A, B, C]
          ancestorCanvasPaths: [
            "alpha.canvas",
            "beta.canvas",
            "gamma.canvas",
          ],
          notesContent: {
            "delta.canvas": JSON.stringify({
              nodes: [
                {
                  id: "node-d",
                  type: "text",
                  text: "Leaf Canvas D",
                  x: 0,
                  y: 0,
                  width: 200,
                  height: 150,
                },
              ],
              edges: [],
            }),
          },
        }}
      >
        <NestedCanvasCardView filePath="delta.canvas" />
      </CanvasEditorContext.Provider>,
    );

    expect(screen.getByTestId("nested-canvas-depth-error")).toBeDefined();
    expect(screen.getByText("Nesting limit reached")).toBeDefined();
    expect(
      screen.getByText("Maximum nesting depth of 3 exceeded"),
    ).toBeDefined();
    expect(screen.queryByTestId("nested-canvas-flow")).toBeNull();
  });

  // 4. Normal, Valid Moderate-Depth Nested Canvas (2-3 levels, acyclic)
  it("Verification 4: renders valid moderate-depth nested canvas without false positives", () => {
    const validCanvasJson = JSON.stringify({
      nodes: [
        {
          id: "text-child",
          type: "text",
          text: "Child Canvas Content",
          x: 50,
          y: 50,
          width: 300,
          height: 200,
        },
      ],
      edges: [],
    });

    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          ancestorCanvasPaths: ["root.canvas"],
          notesContent: {
            "boards/sub-canvas.canvas": validCanvasJson,
          },
        }}
      >
        <NestedCanvasCardView filePath="boards/sub-canvas.canvas" />
      </CanvasEditorContext.Provider>,
    );

    expect(screen.getByTestId("nested-canvas-flow")).toBeDefined();
    expect(screen.queryByTestId("nested-canvas-cycle-error")).toBeNull();
    expect(screen.queryByTestId("nested-canvas-depth-error")).toBeNull();
  });

  it("renders empty canvas placeholder when nested canvas has 0 nodes", () => {
    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          ancestorCanvasPaths: ["root.canvas"],
          notesContent: {
            "empty.canvas": JSON.stringify({ nodes: [], edges: [] }),
          },
        }}
      >
        <NestedCanvasCardView filePath="empty.canvas" />
      </CanvasEditorContext.Provider>,
    );

    expect(screen.getByTestId("nested-canvas-empty-state")).toBeDefined();
    expect(screen.getByText("Empty canvas")).toBeDefined();
  });
});
