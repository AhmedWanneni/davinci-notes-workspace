import type { ClipMode, ClipPayload, ClipTemplate } from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";
import { buildClipFromPage } from "../clip/buildClipFromPage";
import { composeNoteFile, suggestedFilePath } from "../clip/composeNoteFile";
import type { ExtractedContent } from "../page/buildVariableContext";
import { parsePageHtml } from "../page/parsePageHtml";
import { schemaTypesOf } from "../page/schemaTypes";
import { matchTemplate } from "../templates/matchTemplate";
import { fallbackTemplate } from "../templates/templateStore";

export interface ClipSessionInput {
  capture: PageCapture;
  templates: readonly ClipTemplate[];
  now: Date;
  clipId: string;
  capturedAt: string;
  /** Overrides the default (selection when text is selected, otherwise full). */
  mode?: ClipMode;
  highlights?: string[];
}

export interface ClipSession {
  template: ClipTemplate;
  mode: ClipMode;
  payload: ClipPayload;
  extracted: ExtractedContent;
  noteFile: string;
  suggestedPath: string;
}

export function defaultClipMode(capture: PageCapture): ClipMode {
  return capture.selection && capture.selection.trim().length > 0
    ? "selection"
    : "full";
}

/**
 * One complete clip: choose a template, extract, render, and produce the file.
 * Everything except reading the page and downloading it, so the whole flow is
 * unit-testable.
 */
export function runClipSession(input: ClipSessionInput): ClipSession {
  const mode = input.mode ?? defaultClipMode(input.capture);
  // The page DOM is parsed exactly once per clip and reused for both template
  // matching and rendering.
  const doc = parsePageHtml(input.capture.html, input.capture.url);
  const templates =
    input.templates.length > 0 ? input.templates : [fallbackTemplate()];
  const template =
    matchTemplate(templates, {
      url: input.capture.url,
      schemaTypes: schemaTypesOf(doc),
    }) ?? fallbackTemplate();

  const { payload, extracted } = buildClipFromPage({
    capture: input.capture,
    doc,
    template,
    mode,
    now: input.now,
    clipId: input.clipId,
    capturedAt: input.capturedAt,
    highlights: input.highlights,
  });

  return {
    template,
    mode,
    payload,
    extracted,
    noteFile: composeNoteFile(payload),
    suggestedPath: suggestedFilePath(payload),
  };
}
