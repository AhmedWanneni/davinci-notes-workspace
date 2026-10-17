import type { VariableValue } from "@app/clipper-core";
import { isUrlAttribute, resolveUrl } from "./resolveUrl";

/**
 * Resolve a `selector:` / `selectorHtml:` variable against the page.
 *
 * An invalid selector from an imported template must not throw and must not fall
 * back to a broader query — it resolves to "no value". URL-valued attributes are
 * made absolute against the document base (see `parsePageHtml`).
 */
export function querySelectorValues(
  doc: Document,
  selector: string,
  attribute?: string,
): VariableValue {
  const trimmed = selector.trim();
  if (trimmed.length === 0) return undefined;

  let elements: Element[];
  try {
    elements = Array.from(doc.querySelectorAll(trimmed));
  } catch {
    return undefined;
  }
  if (elements.length === 0) return undefined;

  if (attribute === "html") {
    const html = elements.map((element) => element.outerHTML);
    return html.length === 1 ? html[0] : html;
  }

  const values = elements
    .map((element) => {
      if (!attribute) return (element.textContent ?? "").trim();
      const raw = (element.getAttribute(attribute) ?? "").trim();
      return isUrlAttribute(attribute) ? resolveUrl(raw, doc.baseURI) : raw;
    })
    .filter((value) => value.length > 0);

  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : values;
}
