import type { DatabaseColumn, CellValidationResult } from "./databaseTypes";

const ISO_DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const NUMBER_REGEX = /^-?(?:\d+(?:[.,]\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export function validateCellValue(
  value: string,
  column: DatabaseColumn,
): CellValidationResult {
  const trimmed = value.trim();
  if (trimmed === "") {
    return { isValid: true };
  }

  switch (column.type) {
    case "number": {
      if (!NUMBER_REGEX.test(trimmed)) {
        return { isValid: false, warning: "Value is not a valid number" };
      }
      return { isValid: true };
    }
    case "date": {
      if (!ISO_DATE_REGEX.test(trimmed)) {
        return { isValid: false, warning: "Date must be in YYYY-MM-DD format" };
      }
      return { isValid: true };
    }
    case "select": {
      if (!column.options || column.options.length === 0) {
        return { isValid: true };
      }
      const match = column.options.some(
        (opt) => opt.value.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!match) {
        return { isValid: false, warning: `Value "${trimmed}" is not in select options` };
      }
      return { isValid: true };
    }
    case "checkbox": {
      const lower = trimmed.toLowerCase();
      if (
        lower === "true" ||
        lower === "false" ||
        lower === "x" ||
        lower === "[x]" ||
        lower === "[ ]" ||
        lower === ""
      ) {
        return { isValid: true };
      }
      return { isValid: false, warning: "Value is not a valid boolean" };
    }
    case "text":
    default:
      return { isValid: true };
  }
}

export function parseCheckboxValue(raw: string): boolean {
  const clean = raw.trim().toLowerCase();
  return clean === "true" || clean === "x" || clean === "[x]";
}

export function formatCheckboxValue(nextChecked: boolean, previousRaw: string): string {
  const clean = previousRaw.trim();
  if (clean === "x") return nextChecked ? "x" : "";
  if (clean === "X") return nextChecked ? "X" : "";
  if (clean === "[x]" || clean === "[X]" || clean === "[ ]") {
    return nextChecked ? "[x]" : "[ ]";
  }
  return nextChecked ? "true" : "false";
}
