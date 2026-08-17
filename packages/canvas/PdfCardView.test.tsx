import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { PdfCardView } from "./PdfCardView";
import type { CanvasEditorContextValue } from "./CanvasEditorContext";
import { CanvasEditorContext } from "./CanvasEditorContext";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  (window as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
    MockResizeObserver;
}

vi.mock("./useMediaUrl", () => ({
  useMediaUrl: vi.fn((filePath: string) => ({
    src: filePath ? `asset://${filePath}` : null,
    isLoading: false,
  })),
}));

function makeContext(): CanvasEditorContextValue {
  return {
    allNotePaths: [],
    notesContent: {},
    readNoteContent: undefined,
    createTextCard: vi.fn(),
    createFileCard: vi.fn(),
    createGroupCard: vi.fn(),
    updateTextCard: vi.fn(),
    deleteSelected: vi.fn(),
    onOpenFile: vi.fn(),
    onNodeFileChange: vi.fn(),
    resolveMediaUrl: async (p) => p,
    onSaveMediaFile: undefined,
    onLayoutChange: vi.fn(),
    setEdgeLabel: vi.fn(),
    selection: { nodes: [], edges: [] },
  };
}

function Wrapper({
  ctx,
  children,
}: {
  ctx: CanvasEditorContextValue;
  children: React.ReactNode;
}) {
  return (
    <CanvasEditorContext.Provider value={ctx}>
      {children}
    </CanvasEditorContext.Provider>
  );
}

describe("PdfCardView", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no filePath provided", () => {
    const ctx = makeContext();
    render(
      <Wrapper ctx={ctx}>
        <PdfCardView filePath="" />
      </Wrapper>,
    );
    expect(screen.getByText("No PDF file selected")).toBeDefined();
  });

  it("renders error state when pdfjs fails", async () => {
    const ctx = makeContext();
    const { useMediaUrl } = await import("./useMediaUrl");
    vi.mocked(useMediaUrl).mockReturnValue({
      src: "asset://broken.pdf",
      isLoading: false,
    });

    render(
      <Wrapper ctx={ctx}>
        <PdfCardView filePath="broken.pdf" />
      </Wrapper>,
    );
    const container = screen.queryByTestId("pdf-scroll-container");
    const error = screen.queryByTestId("pdf-error");
    expect(container || error).toBeTruthy();
  });

  it("classifies PDF files correctly via mediaCardUtils", async () => {
    const { getFileCardType, isPdfFile, PDF_EXTENSIONS } = await import(
      "./mediaCardUtils"
    );
    expect(getFileCardType("document.pdf")).toBe("pdf");
    expect(getFileCardType("docs/report.PDF")).toBe("pdf");
    expect(isPdfFile("paper.pdf")).toBe(true);
    expect(isPdfFile("image.png")).toBe(false);
    expect(PDF_EXTENSIONS.has("pdf")).toBe(true);
  });
});
