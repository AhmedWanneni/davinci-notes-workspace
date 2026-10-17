import Defuddle from "defuddle";
import type { ExtractedContent } from "../page/buildVariableContext";
import { htmlToMarkdown } from "./htmlToMarkdown";

/**
 * Extract the main content of a page as Markdown (ADR-0174: Defuddle).
 *
 * Invariants:
 *
 * 1. `parse()` is used, never `parseAsync()`. Defuddle's async extractors can
 *    fetch from a third-party API (FxTwitter) when a page has no server-rendered
 *    content; a clip must never cause a network request on the user's behalf.
 *    `useAsync: false` is belt-and-braces on top of not calling the async path.
 * 2. `parse()` is given the caller's document and does **not** mutate it —
 *    Defuddle clones internally. `extractArticle.test.ts` pins that behaviour,
 *    because the rest of the pipeline reads `selector:` variables from the same
 *    document afterwards.
 * 3. Markdown comes from our own Turndown conversion of `result.content`, not
 *    from Defuddle's own converter (which is only in the heavier `full` bundle).
 */
export function extractArticle(doc: Document, url: string): ExtractedContent {
  try {
    const result = new Defuddle(doc, { url, useAsync: false }).parse();
    const markdown = htmlToMarkdown(result.content);

    return {
      markdown,
      html: result.content,
      title: result.title,
      site: result.site,
      author: result.author,
      published: result.published,
      description: result.description,
      image: result.image,
      favicon: result.favicon,
      language: result.language,
      wordCount: result.wordCount,
    };
  } catch (error) {
    return {
      markdown: "",
      html: "",
      error: error instanceof Error ? error.message : "extraction failed",
    };
  }
}
