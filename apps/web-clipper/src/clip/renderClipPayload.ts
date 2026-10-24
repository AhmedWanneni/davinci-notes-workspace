import {
  buildClipPayload,
  createFilterRegistry,
  extractImageAttachments,
  renderClipTemplate,
  type ClipHighlight,
  type ClipPayload,
  type ClipTemplate,
  type RenderContext,
} from "@app/clipper-core";
import { htmlToMarkdown } from "../extraction/htmlToMarkdown";
import type { ExtractedContent } from "../page/buildVariableContext";
import type { ClipContext } from "./prepareClipContext";

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
 * Render one template against an already-prepared page (ADR-0176).
 *
 * Cheap compared with `prepareClipContext`: it resolves variables and produces the
 * payload. That split is what lets the popup switch templates without extracting
 * the page again, so this takes a `ClipContext` rather than a page.
 */
export function renderClipPayload(
  context: ClipContext,
  template: ClipTemplate,
  ids: { clipId: string; capturedAt: string },
): ClipBuildResult {
  const { capture, snapshot, extracted, variables, now } = context;

  const renderContext: RenderContext = {
    variables,
    filters: extensionFilters(),
    runtime: { now },
  };

  const rendered = renderClipTemplate(template, renderContext, {});

  const payload = buildClipPayload({
    template,
    rendered,
    mode: context.mode,
    clipId: ids.clipId,
    capturedAt: ids.capturedAt,
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
    highlights: toHighlights(snapshot.highlights ?? [], ids.capturedAt),
    attachments: template.downloadImages
      ? extractImageAttachments(rendered.body)
      : undefined,
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
