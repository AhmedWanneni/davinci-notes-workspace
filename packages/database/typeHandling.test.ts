import { describe, it, expect } from "vitest";
import { validateCellValue, parseCheckboxValue, formatCheckboxValue } from "./typeValidators";
import type { DatabaseColumn } from "./databaseTypes";

describe("Part 1: Type Handling & Validation Verification", () => {
  it("validates number variants correctly", () => {
    const col: DatabaseColumn = { name: "Price", type: "number" };

    expect(validateCellValue("1.5", col).isValid).toBe(true);
    expect(validateCellValue("1,5", col).isValid).toBe(true);
    expect(validateCellValue("-3", col).isValid).toBe(true);
    expect(validateCellValue("1e3", col).isValid).toBe(true);
    expect(validateCellValue("0", col).isValid).toBe(true);
    expect(validateCellValue("", col).isValid).toBe(true);
    expect(validateCellValue("   ", col).isValid).toBe(true);

    const invalid = validateCellValue("abc", col);
    expect(invalid.isValid).toBe(false);
    expect(invalid.warning).toBeDefined();
  });

  it("validates ISO date format correctly", () => {
    const col: DatabaseColumn = { name: "Due", type: "date" };

    expect(validateCellValue("2026-10-25", col).isValid).toBe(true);
    expect(validateCellValue("2024-02-29", col).isValid).toBe(true);
    expect(validateCellValue("", col).isValid).toBe(true);

    expect(validateCellValue("2026-13-45", col).isValid).toBe(false);
    expect(validateCellValue("yesterday", col).isValid).toBe(false);
    expect(validateCellValue("10/25/2026", col).isValid).toBe(false);
  });

  it("validates select options and flags unlisted values", () => {
    const col: DatabaseColumn = {
      name: "Status",
      type: "select",
      options: [
        { value: "To do", color: "yellow" },
        { value: "Doing", color: "blue" },
        { value: "Done", color: "green" },
      ],
    };

    expect(validateCellValue("To do", col).isValid).toBe(true);
    expect(validateCellValue("DONE", col).isValid).toBe(true);
    expect(validateCellValue("", col).isValid).toBe(true);

    const invalid = validateCellValue("In Review", col);
    expect(invalid.isValid).toBe(false);
    expect(invalid.warning).toContain("In Review");
  });

  it("handles checkbox variants and preserves formatting style on write-back", () => {
    expect(parseCheckboxValue("true")).toBe(true);
    expect(parseCheckboxValue("false")).toBe(false);
    expect(parseCheckboxValue("x")).toBe(true);
    expect(parseCheckboxValue("X")).toBe(true);
    expect(parseCheckboxValue("[x]")).toBe(true);
    expect(parseCheckboxValue("[ ]")).toBe(false);

    // Write back preserves format
    expect(formatCheckboxValue(true, "false")).toBe("true");
    expect(formatCheckboxValue(false, "true")).toBe("false");
    expect(formatCheckboxValue(true, "x")).toBe("x");
    expect(formatCheckboxValue(false, "x")).toBe("");
    expect(formatCheckboxValue(true, "X")).toBe("X");
    expect(formatCheckboxValue(true, "[ ]")).toBe("[x]");
    expect(formatCheckboxValue(false, "[x]")).toBe("[ ]");
  });
});
