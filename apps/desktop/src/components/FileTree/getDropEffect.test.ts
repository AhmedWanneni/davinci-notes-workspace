// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getDropEffect,
  getParentFolder,
  isHiddenOrSystemPath,
  setActiveDraggedNode,
} from "./getDropEffect";
import { useFileTreeDrop } from "./useFileTreeDrop";

describe("getDropEffect pure function", () => {
  describe("helper utilities", () => {
    it("getParentFolder returns correct directory or empty string for root", () => {
      expect(getParentFolder("")).toBe("");
      expect(getParentFolder("note.md")).toBe("");
      expect(getParentFolder("notes/sub/doc.md")).toBe("notes/sub");
      expect(getParentFolder("notes/sub")).toBe("notes");
    });

    it("isHiddenOrSystemPath detects dotfiles and hidden directories", () => {
      expect(isHiddenOrSystemPath(".git")).toBe(true);
      expect(isHiddenOrSystemPath("notes/.git/config")).toBe(true);
      expect(isHiddenOrSystemPath(".obsidian/workspace.json")).toBe(true);
      expect(isHiddenOrSystemPath("notes/regular.md")).toBe(false);
      expect(isHiddenOrSystemPath("notes/subfolder")).toBe(false);
    });
  });

  describe("drop target validation", () => {
    it("returns 'none' for self-drop (folder onto itself)", () => {
      expect(getDropEffect("projects", "projects")).toBe("none");
      expect(
        getDropEffect(
          { path: "projects", isFolder: true },
          { path: "projects", isFolder: true },
        ),
      ).toBe("none");
    });

    it("returns 'none' for descendant drop (folder into subfolder or deep child)", () => {
      expect(getDropEffect("projects", "projects/sub")).toBe("none");
      expect(getDropEffect("projects", "projects/sub/deep/nested")).toBe(
        "none",
      );
      expect(
        getDropEffect(
          { path: "projects", isFolder: true },
          { path: "projects/sub", isFolder: true },
        ),
      ).toBe("none");
    });

    it("returns 'none' for current parent (dropping where item already lives)", () => {
      // File in "notes" dropped into "notes"
      expect(getDropEffect("notes/alpha.md", "notes")).toBe("none");
      // File in root dropped into root
      expect(getDropEffect("alpha.md", "")).toBe("none");
      // Folder in "work" dropped into "work"
      expect(getDropEffect("work/projects", "work")).toBe("none");
    });

    it("returns 'none' for hidden or system entries", () => {
      expect(getDropEffect("notes/alpha.md", ".git")).toBe("none");
      expect(getDropEffect("notes/alpha.md", "notes/.obsidian")).toBe("none");
      expect(getDropEffect(".git/HEAD", "notes")).toBe("none");
    });

    it("handles root drops correctly", () => {
      // File inside folder moved to root
      expect(getDropEffect("notes/alpha.md", "")).toBe("move");
      // Folder inside folder moved to root
      expect(getDropEffect("work/projects", "")).toBe("move");
      // Item already at root dropped to root
      expect(getDropEffect("alpha.md", "")).toBe("none");
    });

    it("returns 'move' for valid folder targets", () => {
      expect(getDropEffect("notes/alpha.md", "archive")).toBe("move");
      expect(getDropEffect("work/projects", "archive")).toBe("move");
      expect(getDropEffect("alpha.md", "notes")).toBe("move");
    });

    it("resolves file-row target to its parent folder", () => {
      // Hovering/dropping on a file in "archive" resolves to "archive" -> move
      expect(
        getDropEffect("notes/alpha.md", {
          path: "archive/beta.md",
          isFolder: false,
        }),
      ).toBe("move");

      // Hovering on a file in the SAME parent folder resolves to "notes" -> current parent -> none
      expect(
        getDropEffect("notes/alpha.md", {
          path: "notes/gamma.md",
          isFolder: false,
        }),
      ).toBe("none");

      // Folder dropped on a file inside its descendant resolves to descendant -> none
      expect(
        getDropEffect("projects", {
          path: "projects/sub/note.md",
          isFolder: false,
        }),
      ).toBe("none");
    });
  });
});

describe("fake dataTransfer tests", () => {
  function createFakeDataTransfer(
    types: string[] = ["application/vnd.davinci.note"],
  ) {
    return {
      types,
      effectAllowed: "none",
      dropEffect: "none" as "none" | "copy" | "link" | "move",
      setData: vi.fn(),
      getData: vi.fn(),
      files: [],
    };
  }

  function createFakeDragEvent(
    dataTransfer: ReturnType<typeof createFakeDataTransfer>,
  ) {
    return {
      dataTransfer,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;
  }

  it("sets dropEffect = 'move' on valid target for both dragenter and dragover", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/doc.md", isFolder: false });

    // 1. dragenter on valid folder
    const dtEnter = createFakeDataTransfer();
    const eventEnter = createFakeDragEvent(dtEnter);
    act(() => {
      result.current.handleDragEnter(eventEnter);
    });

    expect(eventEnter.preventDefault).toHaveBeenCalled();
    expect(dtEnter.dropEffect).toBe("move");

    // 2. dragover on valid folder
    const dtOver = createFakeDataTransfer();
    const eventOver = createFakeDragEvent(dtOver);
    act(() => {
      result.current.handleDragOver(eventOver);
    });

    expect(eventOver.preventDefault).toHaveBeenCalled();
    expect(dtOver.dropEffect).toBe("move");

    setActiveDraggedNode(null);
  });

  it("sets dropEffect = 'none' on invalid target for both dragenter and dragover", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));
    // Dragging folder "projects"
    setActiveDraggedNode({ path: "projects", isFolder: true });

    // Invalid target: its own descendant
    const rowEl = document.createElement("div");
    rowEl.className = "file-tree__row";
    rowEl.setAttribute("data-path", "projects/sub");
    rowEl.setAttribute("data-type", "folder");

    const dtEnter = createFakeDataTransfer();
    const eventEnter = {
      ...createFakeDragEvent(dtEnter),
      target: rowEl,
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragEnter(eventEnter);
    });

    expect(eventEnter.preventDefault).toHaveBeenCalled();
    expect(dtEnter.dropEffect).toBe("none");

    const dtOver = createFakeDataTransfer();
    const eventOver = {
      ...createFakeDragEvent(dtOver),
      target: rowEl,
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragOver(eventOver);
    });

    expect(eventOver.preventDefault).toHaveBeenCalled();
    expect(dtOver.dropEffect).toBe("none");

    setActiveDraggedNode(null);
  });

  it("does not allow copy/copyMove/all for internal moves", () => {
    const { result } = renderHook(() => useFileTreeDrop({}));
    setActiveDraggedNode({ path: "notes/doc.md", isFolder: false });

    const dt = createFakeDataTransfer();
    dt.effectAllowed = "move"; // dragstart sets effectAllowed = 'move'
    const event = createFakeDragEvent(dt);
    act(() => {
      result.current.handleDragOver(event);
    });

    expect(dt.effectAllowed).toBe("move");
    expect(dt.dropEffect).toBe("move");
    expect(dt.dropEffect).not.toBe("copy");

    setActiveDraggedNode(null);
  });
});
