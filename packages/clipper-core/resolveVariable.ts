import type { MetaAttribute, VariableReference } from "./VariableReference.js";
import type { VariableValue } from "./VariableValue.js";

/**
 * Everything `resolveVariable` is allowed to ask for. The extension implements
 * the page-backed callbacks against the live DOM; `preset` is pre-populated.
 */
export interface VariableContext {
  preset: Record<string, VariableValue>;
  meta?: (attribute: MetaAttribute, key: string) => VariableValue;
  selector?: (selector: string, attribute?: string) => VariableValue;
  selectorHtml?: (selector: string) => VariableValue;
  schema?: (path: string) => VariableValue;
}

/** Rendered verbatim so a deferred feature can never look like empty data. */
export const UNSUPPORTED_PROMPT_MARKER = "[unsupported prompt variable]";

export function resolveVariable(
  reference: VariableReference,
  context: VariableContext,
): VariableValue {
  switch (reference.kind) {
    case "preset":
      // Own properties only: `preset` is a plain object, so a bare read would
      // otherwise hand back `Object.prototype` for `{{__proto__}}`.
      if (
        !Object.prototype.hasOwnProperty.call(context.preset, reference.name)
      ) {
        return undefined;
      }
      return context.preset[reference.name];
    case "meta":
      return context.meta?.(reference.attribute, reference.key);
    case "selector":
      return context.selector?.(reference.selector, reference.attribute);
    case "selectorHtml":
      return context.selectorHtml?.(reference.selector);
    case "schema":
      return context.schema?.(reference.path);
    case "prompt":
      return UNSUPPORTED_PROMPT_MARKER;
    default:
      return undefined;
  }
}
