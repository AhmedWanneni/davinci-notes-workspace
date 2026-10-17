import type { ClipMode, VariableContext } from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";
import { extractContent } from "../extraction/extractContent";
import {
  buildVariableContext,
  type ExtractedContent,
  type PageSnapshot,
} from "../page/buildVariableContext";
import { readSchemaOrg } from "../page/readSchemaOrg";

/**
 * Everything about a page that does not depend on the chosen template.
 *
 * Split out from payload rendering because the two have very different costs:
 * preparation runs the extractor and the DOM reads, while rendering just walks a
 * template. A picker that switches templates must not re-extract, so the popup
 * memoises this by (document, mode).
 */
export interface ClipContext {
  capture: PageCapture;
  snapshot: PageSnapshot;
  extracted: ExtractedContent;
  variables: VariableContext;
  mode: ClipMode;
  now: Date;
}

export interface PrepareClipContextOptions {
  capture: PageCapture;
  /** The page, already parsed by `parsePageHtml(html, url)`. */
  doc: Document;
  mode: ClipMode;
  now: Date;
  highlights?: string[];
}

/**
 * Read the page once: extract its content and build the template variables.
 *
 * `doc` must not be re-parsed per call — parsing a large page's DOM is the most
 * expensive avoidable step in a clip.
 */
export function prepareClipContext(
  options: PrepareClipContextOptions,
): ClipContext {
  const { capture, doc, mode, now } = options;

  const highlights = options.highlights ?? [];
  const snapshot: PageSnapshot = {
    url: capture.url,
    title: capture.title,
    selection: capture.selection,
    selectionHtml: capture.selectionHtml,
    highlights,
  };

  const extracted = extractContent({ mode, doc, snapshot });
  const variables = buildVariableContext({
    doc,
    snapshot,
    extracted,
    now,
    schema: readSchemaOrg(doc),
  });

  return { capture, snapshot, extracted, variables, mode, now };
}
