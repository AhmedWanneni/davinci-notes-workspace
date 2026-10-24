/** Attributes whose values are URLs and must be resolved against the page. */
const URL_ATTRIBUTES = new Set(["src", "href", "poster", "data-src"]);

/**
 * Resolve a possibly-relative URL against a base.
 *
 * Page HTML is parsed inside an extension page, so `document.baseURI` is the
 * `chrome-extension://…` origin unless a `<base>` is injected. Without this,
 * `selector:img.hero?src` and `og:image` would produce URLs pointing at the
 * extension itself.
 */
export function resolveUrl(value: string, base: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  try {
    return new URL(trimmed, base).href;
  } catch {
    return trimmed;
  }
}

export function isUrlAttribute(attribute: string): boolean {
  return URL_ATTRIBUTES.has(attribute.toLowerCase());
}
