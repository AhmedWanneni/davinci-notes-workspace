import { ReactFlowProvider } from "@xyflow/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { LinkCardNode } from "./LinkCardNode";

function renderLinkCard(
  url: string,
  onNodeUrlChange = vi.fn(),
  selected = false,
) {
  const contextValue = {
    onNodeTextChange: vi.fn(),
    onLayoutChange: vi.fn(),
    onNodeUrlChange,
  };

  const nodeProps = {
    id: "link-1",
    data: { url, type: "link" as const },
    selected,
    type: "link",
    zIndex: 1,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    deletable: true,
    selectable: true,
    draggable: true,
  };

  return {
    ...render(
      <ReactFlowProvider>
        <CanvasEditorContext.Provider value={contextValue}>
          <LinkCardNode {...nodeProps} />
        </CanvasEditorContext.Provider>
      </ReactFlowProvider>,
    ),
    onNodeUrlChange,
  };
}

describe("LinkCardNode Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders domain title and sandboxed iframe for standard web URL", () => {
    renderLinkCard("https://wikipedia.org/wiki/Canvas");

    expect(screen.getByTestId("link-card-link-1")).toBeDefined();
    expect(screen.getByText("wikipedia.org")).toBeDefined();
    const iframe = screen.getByTestId("link-card-iframe") as HTMLIFrameElement;
    expect(iframe.src).toBe("https://wikipedia.org/wiki/Canvas");
    expect(iframe.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-forms allow-presentation",
    );
    expect(iframe.getAttribute("referrerpolicy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("renders privacy-enhanced YouTube embed player for YouTube URLs", () => {
    renderLinkCard("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(screen.getByText("youtube.com")).toBeDefined();
    const iframe = screen.getByTestId("link-card-iframe") as HTMLIFrameElement;
    expect(iframe.src).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("displays empty / invalid state when no valid URL is given", () => {
    renderLinkCard("");

    expect(screen.getByText("No URL")).toBeDefined();
    expect(screen.getByText("No URL provided")).toBeDefined();
    expect(screen.queryByTestId("link-card-iframe")).toBeNull();
  });

  it("toggles URL editor and allows saving updated URL", () => {
    const onNodeUrlChange = vi.fn();
    renderLinkCard("https://example.com", onNodeUrlChange);

    const editBtn = screen.getByTestId("link-card-edit-url-btn");
    fireEvent.click(editBtn);

    const input = screen.getByTestId("link-card-url-input") as HTMLInputElement;
    expect(input.value).toBe("https://example.com");

    fireEvent.change(input, { target: { value: "https://newsite.com" } });
    const saveBtn = screen.getByTestId("link-card-url-save-btn");
    fireEvent.click(saveBtn);

    expect(onNodeUrlChange).toHaveBeenCalledWith(
      "link-1",
      "https://newsite.com/",
    );
  });

  it("opens URL in browser safely when external button clicked", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderLinkCard("https://example.com");

    const openBtn = screen.getByTestId("link-card-open-external-btn");
    fireEvent.click(openBtn);

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });
});
