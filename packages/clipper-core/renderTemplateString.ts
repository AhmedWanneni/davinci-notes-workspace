import {
  parseTemplateExpression,
  type TemplateExpression,
} from "./TemplateExpression.js";
import type {
  FilterCall,
  FilterRegistry,
  FilterRuntime,
} from "./filterTypes.js";
import { resolveVariable, type VariableContext } from "./resolveVariable.js";
import type { VariableValue } from "./VariableValue.js";

export type TemplateSegment =
  | { kind: "text"; value: string }
  | { kind: "expression"; expression: TemplateExpression };

export interface RenderContext {
  variables: VariableContext;
  filters: FilterRegistry;
  runtime: FilterRuntime;
}

const OPEN = "{{";
const CLOSE = "}}";

/** Split a template string into literal text and `{{ ... }}` expressions. */
export function parseTemplateString(input: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const start = input.indexOf(OPEN, cursor);
    if (start < 0) {
      segments.push({ kind: "text", value: input.slice(cursor) });
      break;
    }
    const end = input.indexOf(CLOSE, start + OPEN.length);
    if (end < 0) {
      // Unbalanced `{{` — treat the remainder as literal text.
      segments.push({ kind: "text", value: input.slice(cursor) });
      break;
    }
    if (start > cursor) {
      segments.push({ kind: "text", value: input.slice(cursor, start) });
    }
    segments.push({
      kind: "expression",
      expression: parseTemplateExpression(
        input.slice(start + OPEN.length, end),
      ),
    });
    cursor = end + CLOSE.length;
  }

  return segments;
}

export function stringifyValue(value: VariableValue): string {
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

export function applyFilters(
  value: VariableValue,
  filters: FilterCall[],
  registry: FilterRegistry,
  runtime: FilterRuntime,
): VariableValue {
  return filters.reduce<VariableValue>((current, filter) => {
    // Own properties only: `{{title|constructor}}` must not reach
    // `Object.prototype.constructor` and call it.
    if (!Object.prototype.hasOwnProperty.call(registry, filter.name))
      return current;
    const fn = registry[filter.name];
    if (typeof fn !== "function") return current;
    return fn(current, filter.args, runtime);
  }, value);
}

export function renderTemplateString(
  input: string,
  context: RenderContext,
): string {
  return parseTemplateString(input)
    .map((segment) => {
      if (segment.kind === "text") return segment.value;
      const value = resolveVariable(
        segment.expression.reference,
        context.variables,
      );
      const filtered = applyFilters(
        value,
        segment.expression.filters,
        context.filters,
        context.runtime,
      );
      return stringifyValue(filtered);
    })
    .join("");
}
