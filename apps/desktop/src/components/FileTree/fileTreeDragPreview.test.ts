// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  fileTreeDragPreview,
  getOrCreateDragPreviewElement,
  getPreviewIconSvg,
  updateDragPreview,
} from "./fileTreeDragPreview";

function createFakeDragEvent(targetData: {
  path: string;
  name: string;
  type: "file" | "folder";
}) {
  const target = document.createElement("div");
  target.setAttribute("data-path", targetData.path);
  target.setAttribute("data-name", targetData.name);
  target.setAttribute("data-type", targetData.type);
  document.body.appendChild(target);

  const dataStore = new Map<string, string>();
  const setDragImage = vi.fn();

  const dataTransfer = {
    setData: vi.fn((key: string, val: string) => dataStore.set(key, val)),
    getData: vi.fn((key: string) => dataStore.get(key) || ""),
    setDragImage,
    effectAllowed: "none",
    dropEffect: "none",
  };

  return {
    target,
    dataTransfer,
    setDragImage,
  };
}

describe("fileTreeDragPreview", () => {
  it("exports the required methods via fileTreeDragPreview object", () => {
    expect(fileTreeDragPreview.updateDragPreview).toBe(updateDragPreview);
    expect(fileTreeDragPreview.getOrCreateDragPreviewElement).toBe(
      getOrCreateDragPreviewElement,
    );
  });

  it("updates preview content imperatively and synchronously on successive dragstarts", () => {
    // Clean up any existing preview from prior runs
    document.getElementById("file-tree-drag-preview")?.remove();

    // 1. First drag after app load: File A
    const fileA = createFakeDragEvent({
      path: "notes/file-alpha.md",
      name: "file-alpha.md",
      type: "file",
    });

    const previewA = updateDragPreview({
      name: "file-alpha.md",
      type: "file",
      path: "notes/file-alpha.md",
    });
    fileA.dataTransfer.setDragImage(previewA, 12, 14);

    expect(previewA).toBeDefined();
    expect(previewA.id).toBe("file-tree-drag-preview");
    expect(previewA.getAttribute("data-type")).toBe("file");
    expect(previewA.getAttribute("data-path")).toBe("notes/file-alpha.md");
    expect(
      previewA.querySelector(".file-tree-drag-preview__name")?.textContent,
    ).toBe("file-alpha");
    expect(previewA.innerHTML).toContain(
      getPreviewIconSvg("file-alpha.md", "file"),
    );
    expect(fileA.setDragImage).toHaveBeenCalledWith(previewA, 12, 14);

    // 2. Second drag: File B (canvas)
    const fileB = createFakeDragEvent({
      path: "canvases/workflow.canvas",
      name: "workflow.canvas",
      type: "file",
    });

    const previewB = updateDragPreview({
      name: "workflow.canvas",
      type: "file",
      path: "canvases/workflow.canvas",
    });
    fileB.dataTransfer.setDragImage(previewB, 12, 14);

    // Reuses the same DOM element instance
    expect(previewB).toBe(previewA);
    expect(previewB.getAttribute("data-type")).toBe("file");
    expect(previewB.getAttribute("data-path")).toBe("canvases/workflow.canvas");
    expect(
      previewB.querySelector(".file-tree-drag-preview__name")?.textContent,
    ).toBe("workflow");
    expect(previewB.innerHTML).not.toContain("file-alpha");
    expect(previewB.innerHTML).toContain(
      getPreviewIconSvg("workflow.canvas", "file"),
    );
    expect(fileB.setDragImage).toHaveBeenCalledWith(previewB, 12, 14);

    // 3. Third drag: Folder
    const folder = createFakeDragEvent({
      path: "projects/archived",
      name: "archived",
      type: "folder",
    });

    const previewFolder = updateDragPreview({
      name: "archived",
      type: "folder",
      path: "projects/archived",
    });
    folder.dataTransfer.setDragImage(previewFolder, 12, 14);

    expect(previewFolder).toBe(previewA);
    expect(previewFolder.getAttribute("data-type")).toBe("folder");
    expect(previewFolder.getAttribute("data-path")).toBe("projects/archived");
    expect(
      previewFolder.querySelector(".file-tree-drag-preview__name")?.textContent,
    ).toBe("archived");
    expect(previewFolder.innerHTML).not.toContain("workflow");
    expect(previewFolder.innerHTML).toContain(
      getPreviewIconSvg("archived", "folder"),
    );
    expect(folder.setDragImage).toHaveBeenCalledWith(previewFolder, 12, 14);
  });

  it("renders a count badge for multi-select drag previews", () => {
    const preview = updateDragPreview({
      name: "first-doc.md",
      type: "file",
      count: 3,
    });
    const badge = preview.querySelector(".file-tree-drag-preview__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("3");
  });
});
