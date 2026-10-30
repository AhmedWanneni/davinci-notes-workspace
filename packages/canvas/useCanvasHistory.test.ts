import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Node, Edge } from "@xyflow/react";
import { useCanvasHistory } from "./useCanvasHistory";

describe("useCanvasHistory", () => {
  it("records snapshots and handles undo and redo", () => {
    const initialNodes: Node[] = [
      { id: "1", type: "text", position: { x: 0, y: 0 }, data: { text: "A" } },
    ];
    const initialEdges: Edge[] = [];
    const setNodes = vi.fn();
    const setEdges = vi.fn();
    const persistCanvas = vi.fn();

    const { result } = renderHook(() =>
      useCanvasHistory({
        nodes: initialNodes,
        edges: initialEdges,
        setNodes,
        setEdges,
        persistCanvas,
      }),
    );

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // Record next snapshot
    const nextNodes: Node[] = [
      { id: "1", type: "text", position: { x: 100, y: 100 }, data: { text: "A" } },
    ];
    act(() => {
      result.current.recordSnapshot(nextNodes, []);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    // Undo
    act(() => {
      result.current.undo();
    });

    expect(setNodes).toHaveBeenCalledWith(initialNodes);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo
    act(() => {
      result.current.redo();
    });

    expect(setNodes).toHaveBeenCalledWith(nextNodes);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });
});
