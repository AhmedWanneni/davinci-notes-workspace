import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { FileCardNode } from "./FileCardNode";

describe("FileCardNode", () => {
  const mockOpenFile = vi.fn();
  const mockNodeFileChange = vi.fn();

  const renderCard = (
    data: { file?: string; subpath?: string; [key: string]: unknown },
    notesContent: Record<string, string> = {},
  ) => {
    return render(
      <ReactFlowProvider>
        <CanvasEditorContext.Provider
          value={{
            onNodeTextChange: vi.fn(),
            onLayoutChange: vi.fn(),
            allNotePaths: ["notes/alpha.md", "notes/beta.md", "images/photo.png", "videos/clip.mp4"],
            notesContent,
            onOpenFile: mockOpenFile,
            onNodeFileChange: mockNodeFileChange,
          }}
        >
          <FileCardNode
            id="file-node-1"
            data={data}
            type="file"
            selected={false}
            zIndex={1}
            isConnectable={true}
            positionAbsoluteX={0}
            positionAbsoluteY={0}
            dragging={false}
          />
        </CanvasEditorContext.Provider>
      </ReactFlowProvider>,
    );
  };

  it("renders markdown file title and subpath badge correctly", () => {
    renderCard(
      { file: "notes/alpha.md", subpath: "# Architecture" },
      { "notes/alpha.md": "# Architecture\nContent here" },
    );

    expect(screen.getByText("alpha")).toBeDefined();
    expect(screen.getByText("# Architecture")).toBeDefined();
    expect(screen.getByTestId("icon-file")).toBeDefined();
  });

  it("renders an image file card with image icon and <img> tag", () => {
    renderCard({ file: "images/photo.png" });

    expect(screen.getByText("photo.png")).toBeDefined();
    expect(screen.getByTestId("icon-image")).toBeDefined();
    const img = screen.getByTestId("media-image");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("images/photo.png");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("renders a video file card with video icon and <video> tag", () => {
    renderCard({ file: "videos/clip.mp4" });

    expect(screen.getByText("clip.mp4")).toBeDefined();
    expect(screen.getByTestId("icon-video")).toBeDefined();
    const video = screen.getByTestId("media-video");
    expect(video).toBeDefined();
    expect(video.getAttribute("src")).toBe("videos/clip.mp4");
  });

  it("calls onOpenFile when the open file button is clicked", () => {
    renderCard(
      { file: "notes/alpha.md" },
      { "notes/alpha.md": "# Hello World" },
    );

    const openBtn = screen.getByRole("button", {
      name: "Open file",
    });
    fireEvent.click(openBtn);
    expect(mockOpenFile).toHaveBeenCalledWith("notes/alpha.md");
  });

  it("renders a canvas file card with canvas icon and nested canvas container", async () => {
    renderCard(
      { file: "boards/nested.canvas" },
      { "boards/nested.canvas": JSON.stringify({ nodes: [], edges: [] }) },
    );

    expect(screen.getByText("nested")).toBeDefined();
    expect(screen.getByTestId("icon-canvas")).toBeDefined();
    expect(
      await screen.findByTestId("nested-canvas-empty-state"),
    ).toBeDefined();
  });
});

