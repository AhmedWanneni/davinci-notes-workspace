import { describe, it, expect } from "vitest";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";
import { isDatabaseNote } from "./isDatabaseNote";

describe("Part 1: Adversarial Inputs Verification", () => {
  it("fails safely when file is empty", () => {
    expect(isDatabaseNote("")).toBe(false);
    expect(() => parseDatabase("")).toThrow();
  });

  it("fails safely when frontmatter is malformed", () => {
    const raw = "---\ndatabase: [invalid array]\n---\n| Col |\n|---|\n| Val |";
    expect(() => parseDatabase(raw)).toThrow();
  });

  it("fails safely when database marker is present but table is missing", () => {
    const raw = `---
database: table
columns:
  - name: Title
    type: text
---

# Just a heading without any markdown table
Some notes text here.
`;
    expect(isDatabaseNote(raw)).toBe(true);
    expect(() => parseDatabase(raw)).toThrow("No pipe table found after frontmatter");
  });

  it("handles very long lines and 10,000-character cells safely", () => {
    const hugeText = "A".repeat(10000);
    const raw = `---
database: table
columns:
  - name: Huge
    type: text
---

| Huge |
|---|
| ${hugeText} |
`;
    const model = parseDatabase(raw);
    expect(model.rows[0].cells[0]).toBe(hugeText);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("handles a 200-column table safely", () => {
    const colCount = 200;
    const names = Array.from({ length: colCount }, (_, i) => `Col_${i}`);
    const headers = `| ${names.join(" | ")} |`;
    const delimiters = `| ${names.map(() => "---").join(" | ")} |`;
    const row = `| ${names.map((_, i) => `val_${i}`).join(" | ")} |`;

    const raw = `---
database: table
---

${headers}
${delimiters}
${row}
`;
    const model = parseDatabase(raw);
    expect(model.columns.length).toBe(colCount);
    expect(model.rows[0].cells.length).toBe(colCount);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("handles a 5,000-row table safely and losslessly", () => {
    const rowCount = 5000;
    const lines = [
      "---",
      "database: table",
      "columns:",
      "  - name: ID",
      "    type: number",
      "  - name: Name",
      "    type: text",
      "---",
      "",
      "| ID | Name |",
      "|---|---|",
    ];

    for (let i = 0; i < rowCount; i += 1) {
      lines.push(`| ${i} | Item_${i} |`);
    }
    lines.push("");

    const raw = lines.join("\n");
    const model = parseDatabase(raw);
    expect(model.rows.length).toBe(rowCount);
    expect(serializeDatabase(model)).toBe(raw);
  });
});
