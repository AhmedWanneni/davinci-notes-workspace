// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getActiveDraggedNode, setActiveDraggedNode } from "./getDropEffect";
import { useFileTreeDrop } from "./useFileTreeDrop";

function createContainerWithRows() {
  const container = document.createElement("div");
  container.className = "file-tree";

  const folderRow = document.createElement("div");
  folderRow.className = "file-tree__row";
  folderRow.setAttribute("data-path", "archive");
  folderRow.setAttribute("data-type", "folder");
  container.appendChild(folderRow);

  const fileRowInArchive = document.createElement("div");
  fileRowInArchive.className = "file-tree__row";
  fileRowInArchive.setAttribute("data-path", "archive/sample.md");
  fileRowInArchive.setAttribute("data-type", "file");
  container.appendChild(fileRowInArchive);

  const fileRowInNotes = document.createElement("div");
  fileRowInNotes.className = "file-tree__row";
  fileRowInNotes.setAttribute("data-path", "notes/original.md");
  fileRowInNotes.setAttribute("data-type", "file");
  container.appendChild(fileRowInNotes);

  document.body.appendChild(container);
  return { container, folderRow, fileRowInArchive, fileRowInNotes };
}

function createDragEvent(
  target: HTMLElement,
  currentTarget: HTMLElement,
  types = ["application/vnd.davinci.note"],
) {
  return {
    target,
    currentTarget,
    preventDefault: vi.fn(),
    dataTransfer: {
      types,
      dropEffect: "none",
      getData: vi.fn(() => "notes/original.md"),
      files: [],
    },
  } as unknown as React.DragEvent;
}

describe("useFileTreeDrop drag state and dimming lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    setActiveDraggedNode(null);
  });

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

  it("restores draggedPath and activeDraggedNode on window dragend", () => {
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

  it("clears draggedPath and dropTargetFolder on drop", async () => {
    const onMoveNote = vi.fn().mockResolvedValue(true);
    const { container, folderRow } = createContainerWithRows();
    const { result } = renderHook(() => useFileTreeDrop({ onMoveNote }));
    setActiveDraggedNode({ path: "notes/original.md", isFolder: false });

    act(() => {
      result.current.handleDragStart("notes/original.md");
    });

    const dragOverEvent = createDragEvent(folderRow, container);
    act(() => {
      result.current.handleDragOver(dragOverEvent);
    });
    expect(result.current.dropTargetFolder).toBe("archive");

    const dropEvent = createDragEvent(folderRow, container);
    await act(async () => {
      await result.current.handleDrop(dropEvent);
    });

    expect(onMoveNote).toHaveBeenCalledWith("notes/original.md", "archive");
    expect(result.current.draggedPath).toBeNull();
    expect(result.current.dropTargetFolder).toBeNull();
    expect(getActiveDraggedNode()).toBeNull();
  });

  it("highlights parent folder when hovering a file row", () => {
    const { container, fileRowInArchive, fileRowInNotes } =
      createContainerWithRows();
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/original.md", isFolder: false });

    // Hovering file in "archive" -> highlights "archive"
    const eventArchive = createDragEvent(fileRowInArchive, container);
    act(() => {
      result.current.handleDragOver(eventArchive);
    });
    expect(result.current.dropTargetFolder).toBe("archive");

    // Hovering file in "notes" (current parent) -> invalid -> no highlight
    const eventNotes = createDragEvent(fileRowInNotes, container);
    act(() => {
      result.current.handleDragOver(eventNotes);
    });
    expect(result.current.dropTargetFolder).toBeNull();
  });

  it("highlights root when hovering container empty area for note in subfolder", () => {
    const { container } = createContainerWithRows();
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/original.md", isFolder: false });

    // Hovering empty container space (container itself)
    const eventContainer = createDragEvent(container, container);
    act(() => {
      result.current.handleDragOver(eventContainer);
    });
    expect(result.current.dropTargetFolder).toBe("");
  });

  it("triggers onExpandFolder after 600ms hover delay on a collapsed folder", () => {
    const onExpandFolder = vi.fn();
    const { container, folderRow } = createContainerWithRows();
    const { result } = renderHook(() => useFileTreeDrop({ onExpandFolder }));
    setActiveDraggedNode({ path: "notes/original.md", isFolder: false });

    const dragOverEvent = createDragEvent(folderRow, container);
    act(() => {
      result.current.handleDragOver(dragOverEvent);
    });

    expect(onExpandFolder).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(onExpandFolder).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onExpandFolder).toHaveBeenCalledWith("archive");
  });

  it("cancels expand timer and resets dropTargetFolder on dragLeave", () => {
    const onExpandFolder = vi.fn();
    const { container, folderRow } = createContainerWithRows();
    const { result } = renderHook(() => useFileTreeDrop({ onExpandFolder }));
    setActiveDraggedNode({ path: "notes/original.md", isFolder: false });

    const dragOverEvent = createDragEvent(folderRow, container);
    act(() => {
      result.current.handleDragOver(dragOverEvent);
    });
    expect(result.current.dropTargetFolder).toBe("archive");

    // Leaving container
    const dragLeaveEvent = {
      currentTarget: container,
      relatedTarget: document.body, // pointer moved outside container
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragLeave(dragLeaveEvent);
    });

    expect(result.current.dropTargetFolder).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpandFolder).not.toHaveBeenCalled();
  });
});
