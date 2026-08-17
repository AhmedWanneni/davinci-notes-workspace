import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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

  it("renders file embed cards from initial content with live note content", () => {
    const contentWithFile = JSON.stringify({
      nodes: [
        {
          id: "f1",
          type: "file",
          file: "projects/alpha.md",
          subpath: "# Architecture",
          x: 0,
          y: 0,
          width: 400,
          height: 320,
        },
      ],
      edges: [],
    });

    render(
      <CanvasView
        path="file-test.canvas"
        initialContent={contentWithFile}
        notesContent={{
          "projects/alpha.md": "# Architecture\nModular system design.",
        }}
      />,
    );

    expect(screen.getByTestId("file-card-f1")).toBeDefined();
    expect(screen.getByText("alpha")).toBeDefined();
    expect(screen.getByText("# Architecture")).toBeDefined();
  });

  it("renders image media cards from initial content", () => {
    const contentWithImage = JSON.stringify({
      nodes: [
        {
          id: "img1",
          type: "file",
          file: "attachments/diagram.png",
          x: 0,
          y: 0,
          width: 400,
          height: 300,
        },
      ],
      edges: [],
    });

    render(
      <CanvasView
        path="image-test.canvas"
        initialContent={contentWithImage}
      />,
    );

    expect(screen.getByTestId("file-card-img1")).toBeDefined();
    expect(screen.getByText("diagram.png")).toBeDefined();
    expect(screen.getByTestId("media-image")).toBeDefined();
  });

  it("creates a file embed card when a note is dropped onto the canvas", () => {
    const onContentChange = vi.fn();
    render(
      <CanvasView
        path="drop-test.canvas"
        initialContent="{}"
        onContentChange={onContentChange}
        allNotePaths={["notes/dropped.md"]}
      />,
    );

    const canvasShell = screen.getByTestId("canvas-shell");
    const dataTransfer = {
      getData: (format: string) =>
        format === "application/vnd.davinci.note" ? "notes/dropped.md" : "",
      types: ["application/vnd.davinci.note"],
      dropEffect: "none",
    };

    fireEvent.dragOver(canvasShell, { dataTransfer });
    fireEvent.drop(canvasShell, {
      clientX: 200,
      clientY: 150,
      dataTransfer,
    });

    expect(screen.getByText("dropped")).toBeDefined();
    expect(onContentChange).toHaveBeenCalled();
  });

  it("creates an image card when a media file is dropped from the file tree", () => {
    const onContentChange = vi.fn();
    render(
      <CanvasView
        path="drop-media-test.canvas"
        initialContent="{}"
        onContentChange={onContentChange}
        allNotePaths={["attachments/photo.png"]}
      />,
    );

    const canvasShell = screen.getByTestId("canvas-shell");
    const dataTransfer = {
      getData: (format: string) =>
        format === "application/vnd.davinci.note" ? "attachments/photo.png" : "",
      types: ["application/vnd.davinci.note"],
      dropEffect: "none",
    };

    fireEvent.dragOver(canvasShell, { dataTransfer });
    fireEvent.drop(canvasShell, {
      clientX: 200,
      clientY: 150,
      dataTransfer,
    });

    expect(screen.getByText("photo.png")).toBeDefined();
    expect(screen.getByTestId("media-image")).toBeDefined();
  });

  it("saves pasted image data to vault attachments and creates image card", async () => {
    const onSaveMediaFile = vi.fn(async (name: string) => name);
    const onContentChange = vi.fn();

    render(
      <CanvasView
        path="paste-test.canvas"
        initialContent="{}"
        onContentChange={onContentChange}
        onSaveMediaFile={onSaveMediaFile}
      />,
    );

    const canvasShell = screen.getByTestId("canvas-shell");
    const blob = new Blob(["fake-image-data"], { type: "image/png" });
    const item = {
      type: "image/png",
      getAsFile: () => blob,
    };

    const clipboardData = {
      items: [item],
      getData: () => "",
    };

    await act(async () => {
      fireEvent.paste(canvasShell, { clipboardData });
    });

    expect(onSaveMediaFile).toHaveBeenCalled();
    const savedPath = onSaveMediaFile.mock.calls[0][0];
    expect(savedPath).toMatch(/^attachments\/Pasted image \d{14}\.png$/);
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

  it("renders a group node with label and nested cards inside", () => {
    const content = JSON.stringify({
      nodes: [
        {
          id: "g1",
          type: "group",
          label: "Research",
          x: 0,
          y: 0,
          width: 500,
          height: 400,
          color: "6",
        },
        {
          id: "t1",
          type: "text",
          text: "Inside card",
          x: 50,
          y: 80,
          width: 150,
          height: 100,
        },
        {
          id: "t2",
          type: "text",
          text: "Outside card",
          x: 600,
          y: 100,
          width: 150,
          height: 100,
        },
      ],
      edges: [],
    });

    render(<CanvasView path="groups.canvas" initialContent={content} />);
    expect(screen.getByTestId("group-card-g1")).toBeDefined();
    expect(screen.getByText("Research")).toBeDefined();
    expect(screen.getByText("Inside card")).toBeDefined();
    expect(screen.getByText("Outside card")).toBeDefined();
  });

  it("renders webpage link cards from initial content", () => {
    const content = JSON.stringify({
      nodes: [
        {
          id: "link-1",
          type: "link",
          url: "https://wikipedia.org",
          x: 0,
          y: 0,
          width: 480,
          height: 360,
        },
      ],
      edges: [],
    });

    render(<CanvasView path="links.canvas" initialContent={content} />);
    expect(screen.getByTestId("link-card-link-1")).toBeDefined();
    expect(screen.getByText("wikipedia.org")).toBeDefined();
    expect(screen.getByTestId("link-card-iframe")).toBeDefined();
  });

  it("creates a link card when a URL is pasted onto the canvas", async () => {
    const onContentChange = vi.fn();
    render(
      <CanvasView
        path="paste-link.canvas"
        initialContent="{}"
        onContentChange={onContentChange}
      />,
    );

    const canvasShell = screen.getByTestId("canvas-shell");
    const clipboardData = {
      items: [],
      getData: (format: string) =>
        format === "text" ? "https://news.ycombinator.com" : "",
    };

    await act(async () => {
      fireEvent.paste(canvasShell, { clipboardData });
    });

    expect(screen.getByText("news.ycombinator.com")).toBeDefined();
    expect(onContentChange).toHaveBeenCalled();
  });

  it("creates a link card when a URL is dropped onto the canvas", () => {
    const onContentChange = vi.fn();
    render(
      <CanvasView
        path="drop-link.canvas"
        initialContent="{}"
        onContentChange={onContentChange}
      />,
    );

    const canvasShell = screen.getByTestId("canvas-shell");
    const dataTransfer = {
      getData: (format: string) =>
        format === "text/plain" ? "https://github.com/facebook/react" : "",
      types: ["text/plain"],
      dropEffect: "none",
    };

    fireEvent.dragOver(canvasShell, { dataTransfer });
    fireEvent.drop(canvasShell, {
      clientX: 200,
      clientY: 150,
      dataTransfer,
    });

    expect(screen.getByText("github.com")).toBeDefined();
    expect(onContentChange).toHaveBeenCalled();
  });
});

