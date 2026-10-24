import type { VariableValue } from "@app/clipper-core";

/**
 * schema.org (JSON-LD) support for `schema:` variables.
 *
 * A page can contain several `@graph` blocks and nested objects, so the index is
 * built once and then queried by `<Type>:<property.path>`. `@type` is only ever
 * used as a lookup key, never as code.
 */
export interface SchemaOrgIndex {
  nodes: Record<string, unknown>[];
  byType: Map<string, Record<string, unknown>[]>;
}

const MAX_JSON_LD_NODES = 200;

/** Property names that turn a nested object back into readable text. */
const READABLE_KEYS = ["name", "text", "headline", "value"];

export function readSchemaOrg(doc: Document): SchemaOrgIndex {
  const nodes: Record<string, unknown>[] = [];
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of Array.from(scripts)) {
    if (nodes.length >= MAX_JSON_LD_NODES) break;
    let parsed: unknown;
    try {
      parsed = JSON.parse(script.textContent ?? "");
    } catch {
      // Malformed JSON-LD is common on real pages; skip it, never throw.
      continue;
    }
    collectNodes(parsed, nodes);
  }

  const byType = new Map<string, Record<string, unknown>[]>();
  for (const node of nodes) {
    for (const type of nodeTypes(node)) {
      const bucket = byType.get(type) ?? [];
      bucket.push(node);
      byType.set(type, bucket);
    }
  }
  return { nodes, byType };
}

function collectNodes(value: unknown, nodes: Record<string, unknown>[]): void {
  if (nodes.length >= MAX_JSON_LD_NODES) return;
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, nodes);
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const record = value as Record<string, unknown>;
  nodes.push(record);
  if (record["@graph"] !== undefined) collectNodes(record["@graph"], nodes);
}

function nodeTypes(node: Record<string, unknown>): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) {
    return type.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function readPath(node: Record<string, unknown>, path: string): unknown {
  let current: unknown = node;
  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null) return undefined;
    const record = current as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, segment))
      return undefined;
    current = record[segment];
  }
  return current;
}

/** Values a schema path can resolve to before being handed to the template engine. */
type SchemaValue =
  string | number | boolean | Record<string, unknown> | SchemaValue[];

function normalize(value: unknown): SchemaValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const items: SchemaValue[] = [];
    for (const entry of value) {
      const normalized = normalize(entry);
      if (normalized === undefined) continue;
      if (Array.isArray(normalized)) items.push(...normalized);
      else items.push(normalized);
    }
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of READABLE_KEYS) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return record;
  }
  return undefined;
}

/**
 * Resolve `Type:property.path`, `property.path`, or a bare `Type`.
 * Multiple matches (e.g. several `Recipe` nodes) resolve to an array.
 */
export function resolveSchemaVariable(
  index: SchemaOrgIndex,
  path: string,
): VariableValue {
  const trimmed = path.trim();
  if (trimmed.length === 0) return undefined;

  const separator = trimmed.indexOf(":");
  const type = separator > 0 ? trimmed.slice(0, separator) : undefined;
  const propertyPath = separator > 0 ? trimmed.slice(separator + 1) : trimmed;

  const candidates =
    type === undefined ? index.nodes : (index.byType.get(type) ?? []);
  const values: SchemaValue[] = [];
  for (const candidate of candidates) {
    const value = normalize(readPath(candidate, propertyPath));
    if (value === undefined) continue;
    if (Array.isArray(value)) values.push(...value);
    else values.push(value);
  }

  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0] as VariableValue;
  return values as VariableValue;
}
