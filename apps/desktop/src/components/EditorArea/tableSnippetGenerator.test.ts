import { describe, expect, it } from "vitest";
import { generateMarkdownTable } from "./tableSnippetGenerator";

describe("generateMarkdownTable", () => {
  it("generates a 1x1 table correctly (1 header + 1 data row)", () => {
    const table = generateMarkdownTable(1, 1);
    expect(table).toBe("| Header 1 |\n| :--- |\n| Cell 1 |\n\n");
  });

  it("generates a 2x2 table with 2 columns and 2 total rows (1 header + 1 data row)", () => {
    const table = generateMarkdownTable(2, 2);
    const lines = table.trim().split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("| Header 1 | Header 2 |");
    expect(lines[1]).toBe("| :--- | :--- |");
    expect(lines[2]).toBe("| Cell 1 | Cell 2 |");
  });

  it("generates a 3x3 table with 3 columns and 3 total rows (1 header + 2 data rows)", () => {
    const table = generateMarkdownTable(3, 3);
    const lines = table.trim().split("\n");

    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("| Header 1 | Header 2 | Header 3 |");
    expect(lines[1]).toBe("| :--- | :--- | :--- |");
    expect(lines[2]).toBe("| Cell 1 | Cell 2 | Cell 3 |");
    expect(lines[3]).toBe("| Cell 4 | Cell 5 | Cell 6 |");
  });

  it("clamps minimum dimensions to at least 1 column and 2 total rows", () => {
    const table = generateMarkdownTable(0, -5);
    expect(table).toBe("| Header 1 |\n| :--- |\n| Cell 1 |\n\n");
  });
});
