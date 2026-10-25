import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DatabaseView } from "./DatabaseView";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 36,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 36,
        size: 36,
      })),
  }),
}));

const SAMPLE_DATABASE = `---
database: table
columns:
  - name: Task
    type: text
  - name: Priority
    type: select
    options:
      - { value: High, color: red }
      - { value: Low, color: green }
  - name: Done
    type: checkbox
---

| Task | Priority | Done |
|---|---|---|
| Buy milk | High | false |
| Ship code | Low | true |
`;

describe("DatabaseView", () => {
  it("renders table header and rows", () => {
    const handleChange = vi.fn();
    render(<DatabaseView content={SAMPLE_DATABASE} onChange={handleChange} />);

    expect(screen.getByText("Task")).toBeDefined();
    expect(screen.getByText("Priority")).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();
    expect(screen.getByText("Buy milk")).toBeDefined();
    expect(screen.getByText("Ship code")).toBeDefined();
  });

  it("filters rows by search query", () => {
    render(<DatabaseView content={SAMPLE_DATABASE} onChange={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("Search rows...");
    fireEvent.change(searchInput, { target: { value: "milk" } });

    expect(screen.getByText("Buy milk")).toBeDefined();
    expect(screen.queryByText("Ship code")).toBeNull();
  });

  it("adds a new row when clicking 'New'", () => {
    const handleChange = vi.fn();
    render(<DatabaseView content={SAMPLE_DATABASE} onChange={handleChange} />);

    const newBtn = screen.getByRole("button", { name: /new/i });
    fireEvent.click(newBtn);

    expect(handleChange).toHaveBeenCalled();
    const updatedContent = handleChange.mock.calls[0][0];
    expect(updatedContent).toContain("|  |  |  |");
  });

  it("toggles checkbox cell directly", () => {
    const handleChange = vi.fn();
    render(<DatabaseView content={SAMPLE_DATABASE} onChange={handleChange} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);

    // Toggle the first unchecked checkbox
    fireEvent.click(checkboxes[0]);
    expect(handleChange).toHaveBeenCalled();
    const updatedContent = handleChange.mock.calls[0][0];
    expect(updatedContent).toContain("| Buy milk | High | true |");
  });

  it("renders safe error fallback on invalid database markdown", () => {
    const handleOpenMarkdown = vi.fn();
    render(
      <DatabaseView
        content="---
database: table
---
Invalid table content"
        onChange={vi.fn()}
        onOpenAsMarkdown={handleOpenMarkdown}
      />,
    );

    expect(
      screen.getByText(/could not be parsed safely as a table/i),
    ).toBeDefined();
    const openBtn = screen.getByRole("button", { name: /open as markdown/i });
    fireEvent.click(openBtn);
    expect(handleOpenMarkdown).toHaveBeenCalled();
  });
});
