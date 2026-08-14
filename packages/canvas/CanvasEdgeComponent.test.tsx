import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Position } from "@xyflow/react";
import { createPortal } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasEdgeComponent } from "./CanvasEdgeComponent";
import { CanvasEditorContext } from "./CanvasEditorContext";

vi.mock("@xyflow/react", async () => {
  const actual =
    await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) =>
      createPortal(children, document.body),
  };
});

describe("CanvasEdgeComponent", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };

  it("renders label tag when label is provided", () => {
    render(
      <svg>
        <CanvasEdgeComponent
          {...defaultProps}
          label="My connection"
          data={{ label: "My connection" }}
        />
      </svg>,
    );

    expect(screen.getByTestId("edge-label-edge-1")).toBeDefined();
    expect(screen.getByText("My connection")).toBeDefined();
  });

  it("does not render empty label element when label is not provided", () => {
    render(
      <svg>
        <CanvasEdgeComponent {...defaultProps} data={{}} />
      </svg>,
    );

    expect(screen.queryByTestId("edge-label-edge-1")).toBeNull();
  });

  it("renders input when in editing mode and commits on enter", () => {
    const onEdgeLabelChange = vi.fn();
    const setEditingEdgeId = vi.fn();

    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: vi.fn(),
          onLayoutChange: vi.fn(),
          onEdgeLabelChange,
          editingEdgeId: "edge-1",
          setEditingEdgeId,
        }}
      >
        <svg>
          <CanvasEdgeComponent
            {...defaultProps}
            label="Old label"
            data={{ label: "Old label" }}
          />
        </svg>
      </CanvasEditorContext.Provider>,
    );

    const input = screen.getByTestId(
      "edge-label-input-edge-1",
    ) as HTMLInputElement;
    expect(input.value).toBe("Old label");

    fireEvent.change(input, { target: { value: "New label" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(setEditingEdgeId).toHaveBeenCalledWith(null);
    expect(onEdgeLabelChange).toHaveBeenCalledWith("edge-1", "New label");
  });
});
