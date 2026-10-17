import {
  buildClipPayload,
  createFilterRegistry,
  renderClipTemplate,
  type ClipHighlight,
  type ClipMode,
  type ClipPayload,
  type ClipTemplate,
  type RenderContext,
} from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";
import { extractContent } from "../extraction/extractContent";
import { htmlToMarkdown } from "../extraction/htmlToMarkdown";
import {
  buildVariableContext,
  type ExtractedContent,
  type PageSnapshot,
} from "../page/buildVariableContext";
import { readSchemaOrg, type SchemaOrgIndex } from "../page/readSchemaOrg";

export interface BuildClipFromPageOptions {
  capture: PageCapture;
  /**
   * The page, already parsed by `parsePageHtml(html, url)`.
   *
   * Passed in rather than parsed here because template matching needs the
   * Schema.org types *before* the template is known, and parsing a large page's
   * DOM twice is the single most expensive avoidable step in a clip.
   */
  doc: Document;
  template: ClipTemplate;
  mode: ClipMode;
  now: Date;
  clipId: string;
  capturedAt: string;
  highlights?: string[];
}

export interface ClipBuildResult {
  payload: ClipPayload;
  extracted: ExtractedContent;
}

/**
 * The filter registry for extension-side rendering.
 *
 * `markdown` gets a real HTML→Markdown converter so `{{selectorHtml:…|markdown}}`
 * works; `clipper-core` itself stays free of an HTML parser.
 */
function extensionFilters(): ReturnType<typeof createFilterRegistry> {
  return createFilterRegistry({
    markdown: (value) => htmlToMarkdown(String(value)),
  });
}

/**
 * Page capture → payload (ADR-0176).
 *
 * One document is used for everything: Defuddle clones internally, so the
 * extractor does not disturb the `selector:` / `schema:` / `meta:` reads that
 * happen afterwards (pinned by `extractArticle.test.ts`).
 */
export function buildClipFromPage(
  options: BuildClipFromPageOptions,
): ClipBuildResult {
  const { capture, doc, template, mode, now, clipId, capturedAt } = options;

  const schema: SchemaOrgIndex = readSchemaOrg(doc);
  const snapshot: PageSnapshot = {
    url: capture.url,
    title: capture.title,
    selection: capture.selection,
    selectionHtml: capture.selectionHtml,
    highlights: options.highlights ?? [],
  };

  const extracted = extractContent({ mode, doc, snapshot });
  const variables = buildVariableContext({
    doc,
    snapshot,
    extracted,
    now,
    schema,
  });

  const renderContext: RenderContext = {
    variables,
    filters: extensionFilters(),
    runtime: { now },
  };

  const rendered = renderClipTemplate(template, renderContext, {});

  const payload = buildClipPayload({
    template,
    rendered,
    mode,
    clipId,
    capturedAt,
    source: {
      url: capture.url,
      title: extracted.title ?? capture.title,
      site: extracted.site,
      domain: safeOrigin(capture.url),
      author: extracted.author,
      published: extracted.published,
      description: extracted.description,
      image: extracted.image,
      favicon: extracted.favicon,
      language: extracted.language,
      wordCount: extracted.wordCount,
    },
    highlights: toHighlights(snapshot.highlights ?? [], capturedAt),
  });

  return { payload, extracted };
}

function safeOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function toHighlights(
  highlights: string[],
  capturedAt: string,
): ClipHighlight[] | undefined {
  const entries = highlights
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
  if (entries.length === 0) return undefined;
  return entries.map((text) => ({ text, createdAt: capturedAt }));
}
