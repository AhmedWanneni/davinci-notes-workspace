// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileTreeContextMenu } from "./FileTreeContextMenu";

describe("FileTreeContextMenu", () => {
  it("renders menu items and triggers onClose on click-away", () => {
    const onClose = vi.fn();
    const onCreateFolder = vi.fn();

    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <FileTreeContextMenu
          x={100}
          y={100}
          parentFolder=""
          notePath="notes/test.md"
          onOpenNote={vi.fn()}
          onRenameNote={vi.fn()}
          onCreateFolder={onCreateFolder}
          onDuplicateNote={vi.fn()}
          onDeleteNote={vi.fn()}
          onClose={onClose}
        />
      </div>,
    );

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Open" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "New folder" })).toBeTruthy();

    // Click outside
    const outside = screen.getByTestId("outside-area");
    fireEvent.pointerDown(outside);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses on Escape keydown", () => {
    const onClose = vi.fn();

    render(
      <FileTreeContextMenu
        x={50}
        y={50}
        parentFolder=""
        onCreateFolder={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses on window blur", () => {
    const onClose = vi.fn();

    render(
      <FileTreeContextMenu
        x={50}
        y={50}
        parentFolder=""
        onCreateFolder={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.blur(window);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses on scroll outside menu", () => {
    const onClose = vi.fn();

    render(
      <div>
        <div data-testid="scroll-container">Content</div>
        <FileTreeContextMenu
          x={50}
          y={50}
          parentFolder=""
          onCreateFolder={vi.fn()}
          onClose={onClose}
        />
      </div>,
    );

    const container = screen.getByTestId("scroll-container");
    fireEvent.scroll(container);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss when clicking inside the menu", () => {
    const onClose = vi.fn();

    render(
      <FileTreeContextMenu
        x={50}
        y={50}
        parentFolder=""
        notePath="test.md"
        onOpenNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onClose={onClose}
      />,
    );

    const menu = screen.getByRole("menu");
    fireEvent.pointerDown(menu);
    expect(onClose).not.toHaveBeenCalled();
  });
});
