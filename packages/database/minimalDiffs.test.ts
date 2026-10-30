import { describe, it, expect } from "vitest";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";
import { editCell, toggleCheckboxCell } from "./cellOperations";
import { addRow, deleteRow, duplicateRow } from "./rowOperations";
import {
  addColumn,
  renameColumn,
  deleteColumn,
  reorderColumns,
  changeColumnType,
} from "./columnOperations";

const BASE_TABLE = `---
database: table
columns:
  - name: Task
    type: text
  - name: Done
    type: checkbox
---

| Task | Done |
|---|---|
| Write tests | false |
| Ship release | true |
`;

function getChangedLines(original: string, modified: string) {
  const origLines = original.split(/\r?\n/);
  const modLines = modified.split(/\r?\n/);
  const changedIndices: number[] = [];
  const max = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < max; i += 1) {
    if (origLines[i] !== modLines[i]) {
      changedIndices.push(i);
    }
  }
  return { changedIndices, origLines, modLines };
}

describe("Part 1: Minimal Diffs Verification", () => {
  it("edit cell: modifies exactly the single targeted row line", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = editCell(model, model.rows[0].id, 0, "Write thorough tests");
    const serialized = serializeDatabase(updated);

    const { changedIndices, modLines } = getChangedLines(BASE_TABLE, serialized);
    expect(changedIndices).toEqual([11]);
    expect(modLines[11]).toBe("| Write thorough tests | false |");
  });

  it("toggle checkbox: modifies only the single targeted row line", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = toggleCheckboxCell(model, model.rows[0].id, 1);
    const serialized = serializeDatabase(updated);

    const { changedIndices, modLines } = getChangedLines(BASE_TABLE, serialized);
    expect(changedIndices).toEqual([11]);
    expect(modLines[11]).toBe("| Write tests | true |");
  });

  it("add row: appends exactly one new row line", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = addRow(model, ["Review PR", "false"]);
    const serialized = serializeDatabase(updated);

    const { origLines, modLines } = getChangedLines(BASE_TABLE, serialized);
    expect(modLines.length).toBe(origLines.length + 1);
    expect(modLines[13]).toBe("| Review PR | false |");
  });

  it("delete row: removes exactly the targeted row line", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = deleteRow(model, model.rows[0].id);
    const serialized = serializeDatabase(updated);

    expect(serialized).not.toContain("Write tests");
    expect(serialized).toContain("Ship release");
  });

  it("duplicate row: duplicates exactly the targeted row line immediately below", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = duplicateRow(model, model.rows[0].id);
    const serialized = serializeDatabase(updated);

    const lines = serialized.split(/\r?\n/);
    expect(lines[11]).toBe("| Write tests | false |");
    expect(lines[12]).toBe("| Write tests | false |");
    expect(lines[13]).toBe("| Ship release | true |");
  });

  it("add column: updates header, delimiter, data rows, and frontmatter", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = addColumn(model, "Priority", "number");
    const serialized = serializeDatabase(updated);

    expect(serialized).toContain("| Task | Done | Priority |");
    expect(serialized).toContain("name: Priority");
    expect(serialized).toContain("type: number");
  });

  it("rename column: updates table header and frontmatter", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = renameColumn(model, "Task", "Assignment");
    const serialized = serializeDatabase(updated);

    expect(serialized).toContain("| Assignment | Done |");
    expect(serialized).toContain("name: Assignment");
    expect(serialized).not.toContain("name: Task");
  });

  it("delete column: removes column across header, delimiter, rows, and frontmatter", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = deleteColumn(model, 1);
    const serialized = serializeDatabase(updated);

    expect(serialized).toContain("| Task |");
    expect(serialized).not.toContain("Done");
  });

  it("reorder columns: reorders header and row cells", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = reorderColumns(model, [1, 0]);
    const serialized = serializeDatabase(updated);

    expect(serialized).toContain("| Done | Task |");
    expect(serialized).toContain("| false | Write tests |");
  });

  it("change column type: updates frontmatter type without corrupting row data", () => {
    const model = parseDatabase(BASE_TABLE);
    const updated = changeColumnType(model, "Task", "select", [
      { value: "Write tests", color: "blue" },
    ]);
    const serialized = serializeDatabase(updated);

    expect(serialized).toContain("type: select");
    expect(serialized).toContain("value: Write tests");
    expect(serialized).toContain("| Write tests | false |");
  });
});
