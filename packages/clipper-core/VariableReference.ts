/**
 * Variable references appearing inside `{{ ... }}`.
 *
 * `clipper-core` is pure (no DOM), so it only *parses* the reference grammar.
 * The extension's DOM adapter resolves `meta:`/`selector:`/`schema:` against the
 * live page; the preset names are the documented Web Clipper preset set.
 */

export type MetaAttribute = "name" | "property";

export interface PresetVariableReference {
  kind: "preset";
  name: string;
}

export interface MetaVariableReference {
  kind: "meta";
  attribute: MetaAttribute;
  key: string;
}

export interface SelectorVariableReference {
  kind: "selector";
  selector: string;
  attribute?: string;
}

export interface SelectorHtmlVariableReference {
  kind: "selectorHtml";
  selector: string;
}

export interface SchemaVariableReference {
  kind: "schema";
  path: string;
}

/** Documented reference feature, deliberately unsupported in v1 (Interpreter). */
export interface PromptVariableReference {
  kind: "prompt";
  prompt: string;
}

export type VariableReference =
  | PresetVariableReference
  | MetaVariableReference
  | SelectorVariableReference
  | SelectorHtmlVariableReference
  | SchemaVariableReference
  | PromptVariableReference;

/** Preset variables per the reference docs. Interpreter-only names are excluded. */
export const PRESET_VARIABLE_NAMES = [
  "author",
  "content",
  "contentHtml",
  "date",
  "description",
  "domain",
  "favicon",
  "fullHtml",
  "highlights",
  "image",
  "language",
  "published",
  "selection",
  "selectionHtml",
  "site",
  "time",
  "title",
  "url",
  "words",
] as const;

const PRE = "meta:";
const SELECTOR_HTML_PRE = "selectorHtml:";
const SELECTOR_PRE = "selector:";
const SCHEMA_PRE = "schema:";

function isQuoted(value: string): boolean {
  return (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  );
}

export function parseVariableReference(source: string): VariableReference {
  const value = source.trim();

  if (isQuoted(value)) {
    return { kind: "prompt", prompt: value.slice(1, -1) };
  }
  if (value.startsWith(PRE)) {
    const rest = value.slice(PRE.length);
    const separator = rest.indexOf(":");
    if (separator > 0) {
      const attribute = rest.slice(0, separator);
      const key = rest.slice(separator + 1);
      if (attribute === "name" || attribute === "property") {
        return { kind: "meta", attribute, key };
      }
    }
    return { kind: "meta", attribute: "name", key: rest };
  }
  if (value.startsWith(SELECTOR_HTML_PRE)) {
    return {
      kind: "selectorHtml",
      selector: value.slice(SELECTOR_HTML_PRE.length),
    };
  }
  if (value.startsWith(SELECTOR_PRE)) {
    const rest = value.slice(SELECTOR_PRE.length);
    const query = rest.indexOf("?");
    if (query >= 0) {
      return {
        kind: "selector",
        selector: rest.slice(0, query),
        attribute: rest.slice(query + 1) || undefined,
      };
    }
    return { kind: "selector", selector: rest };
  }
  if (value.startsWith(SCHEMA_PRE)) {
    return { kind: "schema", path: value.slice(SCHEMA_PRE.length) };
  }
  return { kind: "preset", name: value };
}
