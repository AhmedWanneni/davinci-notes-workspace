// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableGridPicker } from "./TableGridPicker";

describe("TableGridPicker", () => {
  it("renders an 8x8 grid of cells and default 1 x 1 footer", () => {
    render(<TableGridPicker onSelect={vi.fn()} />);

    expect(
      screen.getByRole("grid", { name: "Table dimension picker" }),
    ).toBeDefined();
    expect(screen.getByText("1 x 1")).toBeDefined();
    expect(screen.getByTestId("grid-cell-1-1")).toBeDefined();
    expect(screen.getByTestId("grid-cell-8-8")).toBeDefined();
  });

  it("updates dimensions and highlight state on mouse hover", () => {
    render(<TableGridPicker onSelect={vi.fn()} />);

    const targetCell = screen.getByTestId("grid-cell-3-4");
    fireEvent.mouseEnter(targetCell);

    expect(screen.getByText("3 x 4")).toBeDefined();
  });

  it("calls onSelect with dimensions when a cell is clicked", () => {
    const onSelect = vi.fn();
    render(<TableGridPicker onSelect={onSelect} />);

    const targetCell = screen.getByTestId("grid-cell-4-5");
    fireEvent.click(targetCell);

    expect(onSelect).toHaveBeenCalledWith(4, 5);
  });

  it("supports dragging and releasing to select dimensions", () => {
    const onSelect = vi.fn();
    render(<TableGridPicker onSelect={onSelect} />);

    const startCell = screen.getByTestId("grid-cell-1-1");
    const endCell = screen.getByTestId("grid-cell-5-3");

    fireEvent.mouseDown(startCell);
    fireEvent.mouseEnter(endCell);
    fireEvent.mouseUp(endCell);

    expect(onSelect).toHaveBeenCalledWith(5, 3);
  });
});
