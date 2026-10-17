import { asList, asRegExp, asText } from "./coerceValue.js";
import type { FilterArgument, FilterFunction } from "./filterTypes.js";
import type { VariableValue } from "./VariableValue.js";

export const joinFilter: FilterFunction = (value, args) =>
  asList(value).join(String(args[0] ?? ", "));

export const splitFilter: FilterFunction = (value, args) => {
  const text = asText(value);
  if (args.length === 0)
    return text.split(/\s+/).filter((part) => part.length > 0);

  const separator = String(args[0]);
  const pattern = asRegExp(separator);
  if (pattern) return text.split(pattern);
  return separator.length === 0 ? Array.from(text) : text.split(separator);
};

export const firstFilter: FilterFunction = (value) => {
  if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : "";
  const text = asText(value);
  return text.length > 0 ? text[0] : "";
};

export const lastFilter: FilterFunction = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[value.length - 1]) : "";
  }
  const text = asText(value);
  return text.length > 0 ? text[text.length - 1] : "";
};

function toIndex(
  argument: FilterArgument | undefined,
  fallback: number,
): number {
  if (typeof argument === "number") return argument;
  if (typeof argument === "string") {
    const parsed = Number.parseInt(argument, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export const sliceFilter: FilterFunction = (value, args) => {
  const start = toIndex(args[0], 0);
  const hasEnd = args.length > 1;
  if (Array.isArray(value)) {
    return value.slice(
      start,
      hasEnd ? toIndex(args[1], value.length) : undefined,
    );
  }
  const text = asText(value);
  return text.slice(start, hasEnd ? toIndex(args[1], text.length) : undefined);
};

export const listFilter: FilterFunction = (value, args) => {
  const items = asList(value);
  if (items.length === 0) return "";

  const style = String(args[0] ?? "bullet").toLowerCase();
  const numbered = style.startsWith("numbered");
  const task = style.endsWith("task");

  return items
    .map((item, index) => {
      const marker = numbered ? `${index + 1}. ` : "- ";
      return `${marker}${task ? "[ ] " : ""}${item}`;
    })
    .join("\n");
};

export const tableFilter: FilterFunction = (value, args) => {
  const rawRows: unknown[] = Array.isArray(value) ? value : [];
  if (rawRows.length === 0) return "";

  const defaultKey = args.length > 0 ? String(args[0]) : "Item";
  const records = rawRows.map((row) => {
    if (typeof row === "object" && row !== null && !Array.isArray(row)) {
      return row as Record<string, unknown>;
    }
    return { [defaultKey]: row };
  });

  const availableKeys = Object.keys(records[0] ?? {});
  // Explicit args are header labels; match them to keys case-insensitively so
  // `table:("Rating")` finds `rating`.
  const columns = (
    args.length > 0 ? args.map((arg) => String(arg)) : availableKeys
  ).map((label) => ({
    label,
    key:
      availableKeys.find((key) => key.toLowerCase() === label.toLowerCase()) ??
      label,
  }));

  const escape = (cell: VariableValue): string =>
    asText(cell).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

  const lines = [
    `| ${columns.map((column) => column.label).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
  ];
  for (const record of records) {
    lines.push(
      `| ${columns.map((column) => escape(record[column.key] as VariableValue)).join(" | ")} |`,
    );
  }
  return lines.join("\n");
};
