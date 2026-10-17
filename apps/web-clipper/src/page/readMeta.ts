import type { MetaAttribute } from "@app/clipper-core";

/**
 * Read a `<meta>` tag by `name` or `property`.
 *
 * Page metadata is hostile text, so this returns the raw string and never
 * interprets it; the popup renders it as text (plan §5, verification 1).
 */
function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function readOne(
  doc: Document,
  attribute: MetaAttribute,
  key: string,
): string | undefined {
  const selector = `meta[${attribute}="${escapeAttributeValue(key)}"]`;
  let element: Element | null = null;
  try {
    element = doc.querySelector(selector);
  } catch {
    return undefined;
  }
  const content = element?.getAttribute("content")?.trim();
  return content && content.length > 0 ? content : undefined;
}

export function readMeta(
  doc: Document,
  attribute: MetaAttribute,
  key: string,
): string | undefined {
  if (key.trim().length === 0) return undefined;
  const direct = readOne(doc, attribute, key);
  if (direct !== undefined) return direct;
  // Sites routinely mix the two forms up; try the other one before giving up.
  return readOne(doc, attribute === "name" ? "property" : "name", key);
}
