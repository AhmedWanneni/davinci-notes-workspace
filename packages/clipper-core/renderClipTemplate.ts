import type { ClipPropertyValue } from "./ClipPayload.js";
import type { ClipTemplate } from "./ClipTemplate.js";
import { renderNoteName } from "./noteName.js";
import { isReservedPropertyName } from "./propertyName.js";
import {
  type RenderContext,
  renderTemplateString,
} from "./renderTemplateString.js";
import { safeName, type SafeNameOs } from "./safeName.js";

export interface RenderedClip {
  noteName: string;
  folder: string;
  properties: Record<string, ClipPropertyValue>;
  tags: string[];
  body: string;
}

export interface RenderClipOptions {
  os?: SafeNameOs;
}

const MAX_FOLDER_DEPTH = 8;

/**
 * Sanitize a rendered folder into `/`-joined safe segments.
 *
 * Applies the same name rules to each segment, drops `.`/`..` and empty
 * segments, and caps depth — so `{{...}}/../..` can never escape the vault.
 */
export function normalizeFolder(folder: string): string {
  const segments = folder
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    )
    .map((segment) => safeName(segment, { fallback: "Folder" }))
    .slice(0, MAX_FOLDER_DEPTH);
  return segments.join("/");
}

/**
 * Render a template into the concrete pieces of a clip.
 *
 * This is the extension-side half of the split in ADR-0176: the extension
 * resolves every variable and renders `noteName`, `folder`, `properties`, `tags`
 * and `body`; the desktop only re-validates the result and writes it.
 */
export function renderClipTemplate(
  template: ClipTemplate,
  context: RenderContext,
  options: RenderClipOptions = {},
): RenderedClip {
  const properties: Record<string, ClipPropertyValue> = {};
  for (const property of template.properties) {
    if (isReservedPropertyName(property.name)) continue;
    properties[property.name] = renderTemplateString(
      property.value,
      context,
    ).trim();
  }

  const tags = template.tags
    .map((tag) => renderTemplateString(tag, context).trim())
    .filter((tag) => tag.length > 0);

  return {
    noteName: renderNoteName(template.noteNameFormat, context, {
      os: options.os,
    }),
    folder: normalizeFolder(renderTemplateString(template.folder, context)),
    properties,
    tags,
    body: renderTemplateString(template.body, context).trim(),
  };
}
