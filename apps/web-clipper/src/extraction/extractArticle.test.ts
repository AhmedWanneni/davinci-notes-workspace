import { describe, expect, it } from "vitest";
import { ARTICLE_PAGE_HTML } from "../fixtures/pages";
import { extractArticle } from "./extractArticle";

function parse(html: string = ARTICLE_PAGE_HTML): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("extractArticle", () => {
  it("returns article metadata and Markdown content", () => {
    const result = extractArticle(parse(), "https://probe.example/a");

    expect(result.error).toBeUndefined();
    expect(result.title).toBe("Probe Article");
    expect(result.site).toBe("Probe Site");
    expect(result.author).toBe("Ada Lovelace");
    expect(result.description).toBe(
      "A short description of the probe article.",
    );
    expect(result.wordCount).toBeGreaterThan(0);

    // The body is Markdown, not HTML.
    expect(result.markdown).toContain("First paragraph");
    expect(result.markdown).toContain("**bold**");
    expect(result.markdown).toContain(
      "[another page](https://probe.example/other)",
    );
    expect(result.markdown).toContain("```");
    expect(result.markdown).not.toContain("<p>");
    expect(result.markdown).not.toContain("<strong>");

    // Surrounding clutter is not part of the article.
    expect(result.markdown).not.toContain("Nav clutter");
    expect(result.markdown).not.toContain("Footer clutter");
  });

  it("leaves the document it is given untouched", () => {
    // Defuddle clones internally. The pipeline depends on this: variable
    // resolution reads `selector:` / `schema:` from the same document after
    // extraction has run.
    const doc = parse();
    extractArticle(doc, "https://probe.example/a");

    expect(
      doc.querySelectorAll('script[type="application/ld+json"]').length,
    ).toBe(1);
    expect(doc.querySelectorAll("nav").length).toBe(1);
    expect(doc.querySelectorAll("footer").length).toBe(1);
    expect(doc.querySelectorAll("img.hero").length).toBe(1);
  });

  it("recovers math and callouts from Defuddle's core bundle", () => {
    // Defuddle's *core* bundle has no Markdown converter, but it does annotate
    // MathML with data-latex and normalise .admonition into data-callout. This
    // asserts the exact markup shape that htmlToMarkdown's two rules rely on, so
    // a Defuddle upgrade that changes it fails here rather than silently
    // degrading clipped notes.
    const html = `<html><head><title>Probe</title></head><body><article><h1>Probe</h1>
<p>Inline: <math display="inline"><mi>x</mi><mo>+</mo><mn>1</mn></math> end.</p>
<math display="block"><mi>a</mi><mo>=</mo><mn>2</mn></math>
<div class="admonition warning"><p class="admonition-title">Careful</p><p>Body.</p></div>
</article></body></html>`;

    const result = extractArticle(parse(html), "https://probe.example/a");

    expect(result.html).toContain('data-latex="x+1"');
    expect(result.html).toContain('data-callout="warning"');
    expect(result.markdown).toContain("$x+1$");
    expect(result.markdown).toContain("$$\na=2\n$$");
    expect(result.markdown).toContain("> [!warning] Careful\n> Body.");
  });

  it("degrades to plain text rather than throwing when there is no content", () => {
    const result = extractArticle(
      parse("<!doctype html><html><body></body></html>"),
      "about:blank",
    );

    expect(result.error).toBeUndefined();
    expect(typeof result.markdown).toBe("string");
  });
});
