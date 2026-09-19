// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileTreeContextMenu } from "./FileTreeContextMenu";

describe("FileTreeContextMenu", () => {
  it("renders file actions and invokes correct handlers", () => {
    const onClose = vi.fn();
    const onOpenNote = vi.fn();
    const onRenameNote = vi.fn();
    const onDuplicateNote = vi.fn();
    const onDeleteNote = vi.fn();

    render(
      <FileTreeContextMenu
        x={100}
        y={100}
        targetType="file"
        targetPath="notes/test.md"
        onOpenNote={onOpenNote}
        onNewNote={vi.fn()}
        onNewFolder={vi.fn()}
        onRenameNote={onRenameNote}
        onDuplicateNote={onDuplicateNote}
        onDeleteNote={onDeleteNote}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /^Open/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Duplicate/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Delete/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: /Duplicate/ }));
    expect(onDuplicateNote).toHaveBeenCalledWith("notes/test.md");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders folder actions and invokes correct handlers", () => {
    const onClose = vi.fn();
    const onNewNote = vi.fn();
    const onNewFolder = vi.fn();
    const onRenameFolder = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FileTreeContextMenu
        x={100}
        y={100}
        targetType="folder"
        targetPath="projects"
        onNewNote={onNewNote}
        onNewFolder={onNewFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("menuitem", { name: /^New note/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /^New folder/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Delete/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: /^New note/ }));
    expect(onNewNote).toHaveBeenCalledWith("projects");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders root empty space actions", () => {
    const onClose = vi.fn();
    const onNewNote = vi.fn();
    const onNewFolder = vi.fn();

    render(
      <FileTreeContextMenu
        x={100}
        y={100}
        targetType="root"
        targetPath=""
        onNewNote={onNewNote}
        onNewFolder={onNewFolder}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("menuitem", { name: /^New note/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /^New folder/ })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /Rename/ })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Delete/ })).toBeNull();

    fireEvent.click(screen.getByRole("menuitem", { name: /^New folder/ }));
    expect(onNewFolder).toHaveBeenCalledWith("");
  });

  it("navigates menu items with keyboard arrows", () => {
    const onClose = vi.fn();

    render(
      <FileTreeContextMenu
        x={100}
        y={100}
        targetType="folder"
        targetPath="projects"
        onNewNote={vi.fn()}
        onNewFolder={vi.fn()}
        onRenameFolder={vi.fn()}
        onDeleteFolder={vi.fn()}
        onClose={onClose}
      />,
    );

    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("dismisses on click outside", () => {
    const onClose = vi.fn();

    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <FileTreeContextMenu
          x={100}
          y={100}
          targetType="root"
          targetPath=""
          onNewNote={vi.fn()}
          onNewFolder={vi.fn()}
          onClose={onClose}
        />
      </div>,
    );

    const outside = screen.getByTestId("outside-area");
    fireEvent.pointerDown(outside);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
