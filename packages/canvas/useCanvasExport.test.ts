import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasExport } from "./useCanvasExport";
import * as htmlToImage from "html-to-image";

// Mock @xyflow/react
vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    getNodes: vi.fn(() => [{ id: "1" }]),
    fitView: vi.fn(() => Promise.resolve()),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    setViewport: vi.fn(),
  }),
  getRectOfNodes: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
}));

// Mock html-to-image
vi.mock("html-to-image", () => ({
  toPng: vi.fn(() => Promise.resolve("data:image/png;base64,test")),
}));

describe("useCanvasExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.querySelector
    document.querySelector = vi.fn().mockReturnValue(document.createElement("div"));
  });

  it("should initialize with isExporting: false", () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(result.current.isExporting).toBe(false);
  });

  it("should export viewport", async () => {
    const onExport = vi.fn();
    const { result } = renderHook(() => useCanvasExport({ onExport }));

    await act(async () => {
      await result.current.exportViewport();
    });

    expect(htmlToImage.toPng).toHaveBeenCalled();
    expect(onExport).toHaveBeenCalledWith("data:image/png;base64,test");
    expect(result.current.isExporting).toBe(false);
  });

  it("should export full canvas", async () => {
    const onExport = vi.fn();
    const { result } = renderHook(() => useCanvasExport({ onExport }));

    await act(async () => {
      await result.current.exportFullCanvas();
    });

    expect(htmlToImage.toPng).toHaveBeenCalled();
    expect(onExport).toHaveBeenCalledWith("data:image/png;base64,test");
    expect(result.current.isExporting).toBe(false);
  });
});
