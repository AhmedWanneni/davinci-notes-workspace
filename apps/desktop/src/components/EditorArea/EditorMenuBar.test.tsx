// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorMenuBar } from "./EditorMenuBar";

describe("EditorMenuBar", () => {
  it("renders menu bar tabs and opens dropdown on clicking Insert", () => {
    render(<EditorMenuBar view={null} />);

    const insertTab = screen.getByRole("button", { name: "Insert" });
    expect(insertTab).not.toBeNull();

    // Dropdown is not visible initially
    expect(screen.queryByRole("menu")).toBeNull();

    // Click Insert tab
    fireEvent.click(insertTab);

    // Dropdown items appear
    expect(screen.getByRole("menu")).not.toBeNull();
    expect(screen.getByText("Image")).not.toBeNull();
    expect(screen.getByText("Table")).not.toBeNull();
    expect(screen.getByText("Video")).not.toBeNull();
    expect(screen.getByText("Equation")).not.toBeNull();
    expect(screen.getByText("Page elements")).not.toBeNull();
  });

  it("closes when clicking outside or pressing Escape", () => {
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <EditorMenuBar view={null} />
      </div>,
    );

    const insertTab = screen.getByRole("button", { name: "Insert" });
    fireEvent.click(insertTab);
    expect(screen.getByRole("menu")).not.toBeNull();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("invokes onToggleFormattingToolbar when clicking Format tab", () => {
    const onToggle = vi.fn();
    render(
      <EditorMenuBar
        view={null}
        onToggleFormattingToolbar={onToggle}
        isFormattingToolbarVisible={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Format" }));
    expect(onToggle).toHaveBeenCalled();
  });
});
