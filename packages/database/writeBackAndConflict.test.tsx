import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DatabaseView } from "./DatabaseView";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";
import { editCell } from "./cellOperations";

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

const INITIAL_MD = `---
database: table
columns:
  - name: Title
    type: text
  - name: Status
    type: select
    options:
      - { value: Todo, color: blue }
---

| Title | Status |
|---|---|
| Card 1 | Todo |
| Card 2 | Todo |
`;

describe("Part 3: Write-Back & External-Change Guard", () => {
  it("preserves active cell draft during external file reload", () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <DatabaseView content={INITIAL_MD} onChange={handleChange} />,
    );

    // Double-click the first cell to start inline editing
    const firstCell = screen.getByText("Card 1");
    fireEvent.doubleClick(firstCell);

    // Input should be visible and have initial text "Card 1"
    const input = screen.getByDisplayValue("Card 1") as HTMLInputElement;
    expect(input).toBeDefined();

    // User types in draft
    fireEvent.change(input, { target: { value: "Card 1 - WIP Typing" } });
    expect(input.value).toBe("Card 1 - WIP Typing");

    // External change arrives (e.g. Card 2 was renamed from outside Obsidian/disk)
    const EXTERNAL_MD = INITIAL_MD.replace("Card 2", "Card 2 - Modified on Disk");
    rerender(<DatabaseView content={EXTERNAL_MD} onChange={handleChange} />);

    // Active draft must NOT be erased by the external reload
    expect(input.value).toBe("Card 1 - WIP Typing");

    // Committing the draft saves the WIP edit cleanly
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(handleChange).toHaveBeenCalled();
    const saved = handleChange.mock.calls[0][0];
    expect(saved).toContain("| Card 1 - WIP Typing | Todo |");
  });

  it("never executes writeback when content fails safe parsing", () => {
    const handleChange = vi.fn();
    const CORRUPT_MD = `---
database: table
---
Not a valid pipe table`;

    render(<DatabaseView content={CORRUPT_MD} onChange={handleChange} />);
    expect(screen.getByText(/could not be parsed safely as a table/i)).toBeDefined();
    // No write event fired
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("produces line-level minimal diff writeback for edited cell", () => {
    const model = parseDatabase(INITIAL_MD);
    const updated = editCell(model, model.rows[0].id, 0, "Updated Title");
    const output = serializeDatabase(updated);

    const initialLines = INITIAL_MD.trim().split("\n");
    const outputLines = output.trim().split("\n");

    // Line 13 is the first row
    expect(outputLines[13]).toBe("| Updated Title | Todo |");
    expect(outputLines[14]).toBe(initialLines[14]);
    expect(outputLines[0]).toBe(initialLines[0]);
  });
});
