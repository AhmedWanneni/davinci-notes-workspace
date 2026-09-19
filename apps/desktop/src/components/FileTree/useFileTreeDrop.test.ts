// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getActiveDraggedNode, setActiveDraggedNode } from "./getDropEffect";
import { useFileTreeDrop } from "./useFileTreeDrop";

describe("useFileTreeDrop drag state and dimming lifecycle", () => {
  it("sets draggedPath asynchronously in requestAnimationFrame and restores on dragend", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));

    expect(result.current.draggedPath).toBeNull();

    act(() => {
      result.current.handleDragStart("notes/active.md");
    });

    expect(result.current.draggedPath).toBe("notes/active.md");

    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.draggedPath).toBeNull();
    expect(getActiveDraggedNode()).toBeNull();
  });

  it("restores draggedPath and activeDraggedNode on Escape key", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/active.md", isFolder: false });

    act(() => {
      result.current.handleDragStart("notes/active.md");
    });
    expect(result.current.draggedPath).toBe("notes/active.md");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.draggedPath).toBeNull();
    expect(getActiveDraggedNode()).toBeNull();
  });

  it("restores draggedPath and activeDraggedNode on window dragend (drop outside window)", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/active.md", isFolder: false });

    act(() => {
      result.current.handleDragStart("notes/active.md");
    });
    expect(result.current.draggedPath).toBe("notes/active.md");

    act(() => {
      window.dispatchEvent(new Event("dragend"));
    });

    expect(result.current.draggedPath).toBeNull();
    expect(getActiveDraggedNode()).toBeNull();
  });

  it("clears draggedPath on successful drop", async () => {
    const onMoveNote = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useFileTreeDrop({ onMoveNote }));
    setActiveDraggedNode({ path: "notes/active.md", isFolder: false });

    act(() => {
      result.current.handleDragStart("notes/active.md");
    });
    expect(result.current.draggedPath).toBe("notes/active.md");

    const fakeDropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        types: ["application/vnd.davinci.note"],
        getData: vi.fn(() => "notes/active.md"),
        files: [],
      },
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleDrop(fakeDropEvent, "archive", true);
    });

    expect(onMoveNote).toHaveBeenCalledWith("notes/active.md", "archive");
    expect(result.current.draggedPath).toBeNull();
    expect(getActiveDraggedNode()).toBeNull();
  });
});
