import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { TextCardNode } from "./TextCardNode";

const mockSetNodes = vi.fn();

vi.mock("@xyflow/react", async () => {
  const actual =
    await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    useReactFlow: () => ({ setNodes: mockSetNodes }),
  };
});

describe("TextCardNode", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    cleanup();
    mockSetNodes.mockReset();
  });

  it("renders placeholder text when empty", () => {
    render(
      <ReactFlowProvider>
        <CanvasEditorContext.Provider
          value={{
            onNodeTextChange: vi.fn(),
            onLayoutChange: vi.fn(),
          }}
        >
          <TextCardNode
            id="card-1"
            type="text"
            selected={false}
            dragging={false}
            zIndex={0}
            data={{ text: "", type: "text" }}
            isConnectable={true}
            positionAbsoluteX={0}
            positionAbsoluteY={0}
          />
        </CanvasEditorContext.Provider>
      </ReactFlowProvider>,
    );

    expect(screen.getByText("Double-click to edit")).toBeDefined();
  });

  it("enters edit mode on double-click and commits on blur", () => {
    const onNodeTextChange = vi.fn();

    render(
      <ReactFlowProvider>
        <CanvasEditorContext.Provider
          value={{
            onNodeTextChange,
            onLayoutChange: vi.fn(),
          }}
        >
          <TextCardNode
            id="card-1"
            type="text"
            selected={true}
            dragging={false}
            zIndex={0}
            data={{ text: "Hello", type: "text" }}
            isConnectable={true}
            positionAbsoluteX={0}
            positionAbsoluteY={0}
          />
        </CanvasEditorContext.Provider>
      </ReactFlowProvider>,
    );

    fireEvent.doubleClick(screen.getByText("Hello"));
    const textarea = screen.getByLabelText("Edit text card");
    fireEvent.change(textarea, { target: { value: "Updated" } });
    fireEvent.blur(textarea);

    expect(onNodeTextChange).toHaveBeenCalledWith("card-1", "Updated");
  });
});
