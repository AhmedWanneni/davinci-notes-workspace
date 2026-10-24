import {
  matchTemplate,
  type ClipMode,
  type ClipTemplate,
} from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";
import { defaultClipMode } from "../clip/defaultClipMode";
import type { HighlightRecord } from "../highlighter/HighlightRecord";
import { parsePageHtml } from "../page/parsePageHtml";
import { schemaTypesOf } from "../page/schemaTypes";
import { fallbackTemplate } from "../templates/templateStore";
import type { ClipSessionDeps } from "./clipSessionDeps";

/** The page, read once, plus everything derived from it that is template-independent. */
export interface LoadedClipPage {
  capture: PageCapture;
  doc: Document;
  templates: readonly ClipTemplate[];
  matchedTemplateId?: string;
  clipId: string;
  capturedAt: string;
  now: Date;
  highlights: readonly HighlightRecord[];
}

export interface InitialClipData {
  page: LoadedClipPage;
  mode: ClipMode;
  paired: boolean;
}

/**
 * Load the page, templates, pairing, and highlights in parallel.
 *
 * Keeps `useClipSession` focused on view-state management and under line caps.
 */
export async function loadClipPage(
  deps: ClipSessionDeps,
): Promise<InitialClipData> {
  const {
    loadTemplates,
    loadPairing,
    readCapture,
    loadHighlights,
    newClipId,
    now,
  } = deps;

  const [stored, capture, pairing] = await Promise.all([
    loadTemplates(),
    readCapture(),
    loadPairing(),
  ]);

  const highlights = (await loadHighlights(capture.url)) ?? [];
  const templates = stored.length > 0 ? stored : [fallbackTemplate()];
  const doc = parsePageHtml(capture.html, capture.url);
  const matched = matchTemplate(templates, {
    url: capture.url,
    schemaTypes: schemaTypesOf(doc),
  });
  const moment = now();

  const page: LoadedClipPage = {
    capture,
    doc,
    templates,
    matchedTemplateId: matched?.id,
    clipId: newClipId(),
    capturedAt: moment.toISOString(),
    now: moment,
    highlights,
  };

  return {
    page,
    mode: defaultClipMode(capture),
    paired: pairing !== undefined,
  };
}

export function createHighlightRecord(
  url: string,
  text: string,
  newClipId: () => string,
  now: () => Date,
): HighlightRecord {
  return {
    id: newClipId(),
    url,
    text: text.trim(),
    occurrence: 0,
    createdAt: now().toISOString(),
  };
}
