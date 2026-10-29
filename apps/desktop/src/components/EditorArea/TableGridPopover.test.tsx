// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableGridPopover } from "./TableGridPopover";

describe("TableGridPopover", () => {
  const mockAnchorRect = {
    top: 50,
    bottom: 80,
    left: 100,
    right: 130,
    width: 30,
    height: 30,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect;

  it("renders into document.body when anchorRect is provided", () => {
    render(
      <TableGridPopover
        anchorRect={mockAnchorRect}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const grid = screen.getByRole("grid", { name: "Table dimension picker" });
    expect(grid).toBeDefined();
    expect(grid.parentElement).toBeDefined();
  });

  it("triggers onSelect and onClose when a cell is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <TableGridPopover
        anchorRect={mockAnchorRect}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    const cell = screen.getByTestId("grid-cell-3-2");
    fireEvent.click(cell);

    expect(onSelect).toHaveBeenCalledWith(3, 2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onClose when Escape key is pressed", () => {
    const onClose = vi.fn();

    render(
      <TableGridPopover
        anchorRect={mockAnchorRect}
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns null when anchorRect is null", () => {
    const { container } = render(
      <TableGridPopover
        anchorRect={null}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
