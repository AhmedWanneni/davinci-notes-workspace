import {
  buildPresetClock,
  type VariableContext,
  type VariableValue,
} from "@app/clipper-core";
import { querySelectorValues } from "./querySelectorValues";
import { readMeta } from "./readMeta";
import {
  readSchemaOrg,
  resolveSchemaVariable,
  type SchemaOrgIndex,
} from "./readSchemaOrg";
import { resolveUrl } from "./resolveUrl";

/** Everything read from the page that is not the extracted article body. */
export interface PageSnapshot {
  url: string;
  title: string;
  selection?: string;
  selectionHtml?: string;
  highlights?: string[];
}

/** The clean content produced by the extractor. */
export interface ExtractedContent {
  markdown: string;
  html: string;
  title?: string;
  site?: string;
  author?: string;
  published?: string;
  description?: string;
  image?: string;
  favicon?: string;
  language?: string;
  wordCount?: number;
  /** Set when extraction failed; the popup shows this instead of an empty preview. */
  error?: string;
}

export interface BuildVariableContextOptions {
  doc: Document;
  snapshot: PageSnapshot;
  extracted: ExtractedContent;
  now: Date;
  /**
   * Schema.org index read *before* the extractor mutated the document. Pass it
   * whenever extraction has already run, otherwise the JSON-LD is gone.
   */
  schema?: SchemaOrgIndex;
  /** `fullHtml` is capped so a pathological page cannot exhaust memory. */
  fullHtmlMaxLength?: number;
}

const DEFAULT_FULL_HTML_MAX = 2 * 1024 * 1024;

function firstDefined(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (value !== undefined && value.trim().length > 0) return value;
  }
  return undefined;
}

function domainOf(url: string): string | undefined {
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build the variable map the template engine resolves against (ADR-0176).
 *
 * Preset names match the documented Web Clipper set; anything unsupported
 * (`{{"prompt"}}`) is left to `clipper-core`, which renders it as an explicit
 * placeholder rather than silently empty.
 */
export function buildVariableContext(
  options: BuildVariableContextOptions,
): VariableContext {
  const { doc, snapshot, extracted, now } = options;
  const clock = buildPresetClock(now);
  const schema = options.schema ?? readSchemaOrg(doc);

  const fullHtml = doc.documentElement?.outerHTML ?? "";
  const fullHtmlMax = options.fullHtmlMaxLength ?? DEFAULT_FULL_HTML_MAX;

  const preset: Record<string, VariableValue> = {
    title: firstDefined(extracted.title, snapshot.title, doc.title) ?? "",
    url: snapshot.url,
    domain: domainOf(snapshot.url) ?? "",
    site:
      firstDefined(extracted.site, readMeta(doc, "property", "og:site_name")) ??
      "",
    author:
      firstDefined(extracted.author, readMeta(doc, "name", "author")) ?? "",
    published: firstDefined(extracted.published) ?? "",
    description:
      firstDefined(
        extracted.description,
        readMeta(doc, "name", "description"),
      ) ?? "",
    image: resolveUrl(
      firstDefined(extracted.image, readMeta(doc, "property", "og:image")) ??
        "",
      snapshot.url,
    ),
    favicon: resolveUrl(
      firstDefined(
        extracted.favicon,
        doc.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href,
      ) ?? "",
      snapshot.url,
    ),
    language: firstDefined(extracted.language, doc.documentElement?.lang) ?? "",
    words: extracted.wordCount ?? countWords(extracted.markdown),
    content: extracted.markdown,
    contentHtml: extracted.html,
    fullHtml: fullHtml.slice(0, fullHtmlMax),
    selection: snapshot.selection ?? "",
    selectionHtml: snapshot.selectionHtml ?? "",
    highlights: snapshot.highlights ?? [],
    date: clock.date,
    time: clock.time,
  };

  return {
    preset,
    meta: (attribute, key) => readMeta(doc, attribute, key),
    selector: (selector, attribute) =>
      querySelectorValues(doc, selector, attribute),
    selectorHtml: (selector) => querySelectorValues(doc, selector, "html"),
    schema: (path) => resolveSchemaVariable(schema, path),
  };
}

function countWords(markdown: string): number {
  const trimmed = markdown.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}
