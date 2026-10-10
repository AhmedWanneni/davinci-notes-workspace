// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@app/design-system";
import { FileTreeToolbar } from "./FileTreeToolbar";

function renderToolbar(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("FileTreeToolbar", () => {
  it("renders all 5 action buttons", () => {
    renderToolbar(
      <FileTreeToolbar
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        sortOrder="name-asc"
        onToggleSort={vi.fn()}
        onCollapseAll={vi.fn()}
        onExpandAll={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "New note" })).toBeDefined();
    expect(screen.getByRole("button", { name: "New folder" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sort A to Z" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeDefined();
  });

  it("calls corresponding handlers on button click", () => {
    const onCreateNote = vi.fn();
    const onCreateFolder = vi.fn();
    const onToggleSort = vi.fn();
    const onCollapseAll = vi.fn();
    const onExpandAll = vi.fn();

    renderToolbar(
      <FileTreeToolbar
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        sortOrder="name-asc"
        onToggleSort={onToggleSort}
        onCollapseAll={onCollapseAll}
        onExpandAll={onExpandAll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New note" }));
    expect(onCreateNote).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    expect(onCreateFolder).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Sort A to Z" }));
    expect(onToggleSort).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(onCollapseAll).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(onExpandAll).toHaveBeenCalledTimes(1);
  });

  it("displays Sort Z to A label when sortOrder is name-desc", () => {
    renderToolbar(
      <FileTreeToolbar
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        sortOrder="name-desc"
        onToggleSort={vi.fn()}
        onCollapseAll={vi.fn()}
        onExpandAll={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Sort Z to A" })).toBeDefined();
  });
});
