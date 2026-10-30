import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { CanvasCardActionBar } from "./CanvasCardActionBar";

describe("CanvasCardActionBar", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });
  it("renders action buttons when selected inside a node", () => {
    const onDelete = vi.fn();
    const onColorChange = vi.fn();
    const onZoomTo = vi.fn();
    const onEdit = vi.fn();

    const NodeWrapper = () => (
      <div>
        <CanvasCardActionBar
          selected={true}
          onDelete={onDelete}
          onColorChange={onColorChange}
          onZoomTo={onZoomTo}
          onEdit={onEdit}
        />
      </div>
    );

    render(
      <ReactFlowProvider>
        <ReactFlow
          nodes={[
            {
              id: "n1",
              type: "custom",
              position: { x: 0, y: 0 },
              data: {},
              selected: true,
            },
          ]}
          nodeTypes={{ custom: NodeWrapper }}
        />
      </ReactFlowProvider>,
    );

    const deleteBtn = screen.getByLabelText("Delete card");
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);

    const zoomBtn = screen.getByLabelText("Zoom to card");
    expect(zoomBtn).toBeDefined();
    fireEvent.click(zoomBtn);
    expect(onZoomTo).toHaveBeenCalledTimes(1);

    const editBtn = screen.getByLabelText("Edit card");
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("toggles color palette on click and selects a color", () => {
    const onColorChange = vi.fn();

    const NodeWrapper = () => (
      <div>
        <CanvasCardActionBar
          selected={true}
          onDelete={vi.fn()}
          onColorChange={onColorChange}
          onZoomTo={vi.fn()}
        />
      </div>
    );

    render(
      <ReactFlowProvider>
        <ReactFlow
          nodes={[
            {
              id: "n1",
              type: "custom",
              position: { x: 0, y: 0 },
              data: {},
              selected: true,
            },
          ]}
          nodeTypes={{ custom: NodeWrapper }}
        />
      </ReactFlowProvider>,
    );

    const paletteBtn = screen.getByLabelText("Change color");
    fireEvent.click(paletteBtn);

    const color1 = screen.getByLabelText("Color 1");
    expect(color1).toBeDefined();
    fireEvent.click(color1);
    expect(onColorChange).toHaveBeenCalledWith("1");
  });
});
