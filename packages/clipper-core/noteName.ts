import {
  renderTemplateString,
  type RenderContext,
} from "./renderTemplateString.js";
import { safeName, type SafeNameOptions } from "./safeName.js";

/** Obsidian-compatible default for daily notes. */
export const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";

/**
 * Resolve a note name format to a `.md` filename.
 *
 * The rendered text is passed through `safeName`, so a template can never emit
 * `../` or an absolute path even if the page data is hostile.
 */
export function normalizeNoteName(
  name: string,
  options?: SafeNameOptions,
): string {
  const trimmed = name.trim().replace(/\.md$/i, "");
  return `${safeName(trimmed, options)}.md`;
}

export function renderNoteName(
  format: string,
  context: RenderContext,
  options?: SafeNameOptions,
): string {
  return normalizeNoteName(renderTemplateString(format, context), options);
}
