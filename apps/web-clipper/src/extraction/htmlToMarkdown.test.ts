import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "./htmlToMarkdown";

describe("htmlToMarkdown", () => {
  it("converts common block markup to Obsidian Markdown", () => {
    const markdown = htmlToMarkdown(
      `<h2>Heading</h2><p>Text with <strong>bold</strong> and <em>italic</em>.</p>` +
        `<ul><li>one</li><li>two</li></ul>` +
        `<pre><code>const answer = 42;</code></pre>`,
    );

    expect(markdown).toContain("## Heading");
    expect(markdown).toContain("**bold**");
    expect(markdown).toContain("*italic*");
    expect(markdown).toContain("- one");
    expect(markdown).toContain("```");
  });

  it("recovers LaTeX math from Defuddle's data-latex annotation", () => {
    expect(htmlToMarkdown(`<math data-latex="x^2 + y^2"></math>`)).toBe(
      "$x^2 + y^2$",
    );
    expect(
      htmlToMarkdown(`<math display="block" data-latex="a \\neq 0"></math>`),
    ).toBe("$$\na \\neq 0\n$$");
  });

  it("recovers Obsidian callouts without the heavy Defuddle bundle", () => {
    // The folded shape Defuddle emits for a collapsible callout.
    expect(
      htmlToMarkdown(
        `<div class="callout" data-callout="warning" data-callout-fold="+">` +
          `<div class="callout-title"><div class="callout-title-inner">Careful</div>` +
          `<div class="callout-fold">+</div></div>` +
          `<div class="callout-content"><p>Body text.</p></div>` +
          `</div>`,
      ),
    ).toBe("> [!warning]+ Careful\n> Body text.");

    // The shape Defuddle emits for a converted `.admonition` — no fold
    // attribute, and the body is a direct child rather than `.callout-content`.
    expect(
      htmlToMarkdown(
        `<div data-callout="warning" class="callout">` +
          `<div class="callout-title"><div class="callout-title-inner">Careful</div></div>` +
          `<p>Body text.</p></div>`,
      ),
    ).toBe("> [!warning] Careful\n> Body text.");
  });

  it("drops script and style content", () => {
    expect(htmlToMarkdown(`<style>p{color:red}</style><p>Kept</p>`)).toBe(
      "Kept",
    );
    expect(htmlToMarkdown("")).toBe("");
  });
});
