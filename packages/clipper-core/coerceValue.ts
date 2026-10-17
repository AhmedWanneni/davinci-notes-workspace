import type { VariableValue } from "./VariableValue.js";

/**
 * The single place where a `VariableValue` becomes text or a list of texts.
 * Filters must never invent their own coercion, otherwise `{{a|upper}}` and
 * `{{a|join}}` would disagree about what an array means.
 */
export function asText(value: VariableValue): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("\n");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function asList(value: VariableValue): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "object" && item !== null ? itemText(item) : String(item),
    );
  }
  if (typeof value === "object") return [itemText(value)];
  return [String(value)];
}

/** Objects (e.g. a highlight) expose `.text` when present, else serialize. */
function itemText(value: Record<string, unknown>): string {
  const text = value.text;
  if (typeof text === "string") return text;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/** `/pattern/flags` used by the `replace` and `split` filters. */
export function asRegExp(raw: string): RegExp | undefined {
  const match = /^\/(.+)\/([gimsuy]*)$/.exec(raw);
  if (!match) return undefined;
  try {
    return new RegExp(match[1], match[2]);
  } catch {
    return undefined;
  }
}
