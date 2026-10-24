/**
 * Expression parsing for `{{variable|filter:arg|filter2:(a,b)}}`.
 *
 * Templates are untrusted data. Splitting is done at the top level so that
 * separators inside quotes or parentheses never change the structure, and the
 * result is a closed structure of a variable reference plus named filters.
 */
import type { FilterArgument, FilterCall } from "./filterTypes.js";
import {
  parseVariableReference,
  type VariableReference,
} from "./VariableReference.js";

export interface TemplateExpression {
  /** The raw contents between the braces, trimmed. */
  source: string;
  reference: VariableReference;
  filters: FilterCall[];
}

/**
 * Split `input` on any of `separators`, ignoring separators inside single or
 * double quotes and inside parentheses/brackets/braces.
 */
export function splitTopLevel(input: string, separators: string[]): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: '"' | "'" | undefined;
  let depth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      current += char;
      // A backslash escapes the next character inside a quoted string.
      if (char === "\\" && index + 1 < input.length) {
        current += input[index + 1];
        index += 1;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(" || char === "[" || char === "{") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")" || char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (depth === 0 && separators.includes(char)) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

function unquote(value: string): string {
  const body = value.slice(1, -1);
  return body
    .replace(/\\(["'\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function parseArgumentValue(raw: string): FilterArgument {
  const value = raw.trim();
  if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'"))) {
    return unquote(value);
  }
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

export function parseFilterArguments(rest: string): FilterArgument[] {
  const value = rest.trim();
  if (value.length === 0) return [];

  if (value.startsWith("(") && value.endsWith(")")) {
    const inner = value.slice(1, -1).trim();
    if (inner.length === 0) return [];
    return splitTopLevel(inner, [","])
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map(parseArgumentValue);
  }

  const colonParts = splitTopLevel(value, [":"]).map((part) => part.trim());
  if (colonParts.length > 1) return colonParts.map(parseArgumentValue);

  return splitTopLevel(value, [","])
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(parseArgumentValue);
}

function parseFilterCall(segment: string): FilterCall {
  const parts = splitTopLevel(segment, [":"]);
  const name = parts[0].trim();
  const rest = parts.slice(1).join(":");
  return { name, args: rest.length > 0 ? parseFilterArguments(rest) : [] };
}

export function parseTemplateExpression(source: string): TemplateExpression {
  const trimmed = source.trim();
  const segments = splitTopLevel(trimmed, ["|"]);
  const reference = parseVariableReference(segments[0]);
  const filters = segments
    .slice(1)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map(parseFilterCall);
  return { source: trimmed, reference, filters };
}
