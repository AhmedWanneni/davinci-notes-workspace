import type { ClipMode } from "@app/clipper-core";
import type {
  ExtractedContent,
  PageSnapshot,
} from "../page/buildVariableContext";
import { extractArticle } from "./extractArticle";

export interface ExtractContentOptions {
  mode: ClipMode;
  /** A document this caller owns; `extractArticle` is allowed to mutate it. */
  doc: Document;
  snapshot: PageSnapshot;
}

/**
 * Produce the clip body for the requested mode.
 *
 * `full` runs the article extractor. `selection` and `highlights` are
 * deliberately *not* run through the extractor: the user already chose the text,
 * and templates for those modes use `{{selection}}` / `{{highlights}}`.
 */
export function extractContent(
  options: ExtractContentOptions,
): ExtractedContent {
  const { mode, doc, snapshot } = options;

  if (mode === "selection") {
    return {
      markdown: (snapshot.selection ?? "").trim(),
      html: snapshot.selectionHtml ?? "",
    };
  }

  if (mode === "highlights") {
    const highlights = snapshot.highlights ?? [];
    return {
      markdown: highlights.map((highlight) => highlight.trim()).join("\n\n"),
      html: "",
    };
  }

  if (mode === "bookmark") {
    return {
      markdown: (snapshot.selection ?? "").trim(),
      html: "",
      title: snapshot.title || doc.title || undefined,
    };
  }

  return extractArticle(doc, snapshot.url);
}
