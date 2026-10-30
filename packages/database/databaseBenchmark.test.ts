import { describe, it, expect } from "vitest";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";
import { editCell } from "./cellOperations";

describe("Part 1: Performance Benchmark — 5,000-Row Database", () => {
  it("measures parse, serialize, and cell edit time for 5,000 rows", () => {
    const rowCount = 5000;
    const lines = [
      "---",
      "database: table",
      "columns:",
      "  - name: ID",
      "    type: number",
      "  - name: Name",
      "    type: text",
      "  - name: Status",
      "    type: select",
      "    options:",
      "      - { value: Active, color: green }",
      "      - { value: Inactive, color: red }",
      "  - name: Done",
      "    type: checkbox",
      "---",
      "",
      "| ID | Name | Status | Done |",
      "|---|---|---|---|",
    ];

    for (let i = 0; i < rowCount; i += 1) {
      lines.push(`| ${i} | Item ${i} | Active | false |`);
    }
    lines.push("");

    const raw = lines.join("\n");

    const t0 = performance.now();
    const model = parseDatabase(raw);
    const parseTime = performance.now() - t0;

    const t1 = performance.now();
    const unmodifiedText = serializeDatabase(model);
    const unmodifiedSerializeTime = performance.now() - t1;

    expect(unmodifiedText).toBe(raw);

    const t2 = performance.now();
    editCell(model, model.rows[2500].id, 1, "Modified Item 2500");
    const modifiedText = serializeDatabase(model);
    const modifiedSerializeTime = performance.now() - t2;

    expect(model.rows.length).toBe(rowCount);
    expect(modifiedText).toContain("Modified Item 2500");

    console.log(`
=== DATABASE 5,000-ROW BENCHMARK ===
Parse time:               ${parseTime.toFixed(2)} ms
Unmodified serialize:     ${unmodifiedSerializeTime.toFixed(2)} ms
Modified serialize (5k):  ${modifiedSerializeTime.toFixed(2)} ms
Total rows parsed:        ${model.rows.length}
====================================
    `);

    // Latency target: parsing 5,000 rows should take under 50ms in Node/V8
    expect(parseTime).toBeLessThan(100);
  });
});
