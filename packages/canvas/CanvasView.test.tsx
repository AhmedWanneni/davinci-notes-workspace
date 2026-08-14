import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { CanvasView } from "./CanvasView";

describe("CanvasView Component", () => {
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

  it("renders empty canvas shell with empty state prompt and controls", () => {
    render(<CanvasView path="empty.canvas" initialContent="{}" />);

    expect(screen.getByTestId("canvas-shell")).toBeDefined();
    expect(screen.getByTestId("canvas-empty-state")).toBeDefined();
    expect(screen.getByText("Empty Canvas")).toBeDefined();
    expect(screen.getByLabelText("Add Text Card")).toBeDefined();
    expect(screen.getByLabelText("Zoom In")).toBeDefined();
    expect(screen.getByLabelText("Zoom Out")).toBeDefined();
    expect(screen.getByLabelText("Zoom to Fit")).toBeDefined();
  });

  it("renders text cards from initial content", () => {
    const contentWithNodes = JSON.stringify({
      nodes: [
        {
          id: "n1",
          type: "text",
          text: "Hello",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
      edges: [],
    });

    render(<CanvasView path="test.canvas" initialContent={contentWithNodes} />);
    expect(screen.getByTestId("canvas-shell")).toBeDefined();
    expect(screen.queryByTestId("canvas-empty-state")).toBeNull();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("renders canvas containing connected text cards", () => {
    const contentWithEdges = JSON.stringify({
      nodes: [
        {
          id: "n1",
          type: "text",
          text: "Card 1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          id: "n2",
          type: "text",
          text: "Card 2",
          x: 200,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
      edges: [
        {
          id: "e1",
          fromNode: "n1",
          fromSide: "right",
          toNode: "n2",
          toSide: "left",
          label: "connects to",
          color: "1",
        },
      ],
    });

    render(
      <CanvasView path="connected.canvas" initialContent={contentWithEdges} />,
    );
    expect(screen.getByTestId("canvas-shell")).toBeDefined();
    expect(screen.getByText("Card 1")).toBeDefined();
    expect(screen.getByText("Card 2")).toBeDefined();
  });
});
