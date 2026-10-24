/**
 * Parse captured page HTML the way the rest of the pipeline expects it.
 *
 * A `<base>` element is injected first so that `document.baseURI` is the page's
 * URL rather than the extension origin. Everything that resolves a relative URL
 * — `selector:…?src`, `og:image`, the extractor — depends on that.
 */
export function parsePageHtml(html: string, url: string): Document {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const head = doc.head ?? doc.documentElement;
  if (head) {
    const base = doc.createElement("base");
    base.setAttribute("href", url);
    head.prepend(base);
  }
  return doc;
}
