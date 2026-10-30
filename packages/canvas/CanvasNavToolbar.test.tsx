import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { CanvasNavToolbar } from "./CanvasNavToolbar";

describe("CanvasNavToolbar", () => {
  it("renders zoom, history and utility buttons", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <ReactFlowProvider>
        <CanvasNavToolbar
          canUndo={true}
          canRedo={true}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </ReactFlowProvider>,
    );

    const zoomIn = screen.getByLabelText("Zoom In");
    expect(zoomIn).toBeDefined();

    const zoomOut = screen.getByLabelText("Zoom Out");
    expect(zoomOut).toBeDefined();

    const fitView = screen.getByLabelText("Zoom to Fit");
    expect(fitView).toBeDefined();

    const undoBtn = screen.getByLabelText("Undo");
    expect(undoBtn).toBeDefined();
    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);

    const redoBtn = screen.getByLabelText("Redo");
    expect(redoBtn).toBeDefined();
    fireEvent.click(redoBtn);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });
});
