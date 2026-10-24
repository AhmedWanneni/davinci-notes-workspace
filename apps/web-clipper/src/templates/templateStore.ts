import {
  ARTICLE_TEMPLATE,
  STARTER_TEMPLATES,
  validateClipTemplate,
  type ClipTemplate,
} from "@app/clipper-core";
import type { StorageArea } from "../storage/storageArea";

/**
 * Template persistence.
 *
 * Templates are imported JSON, so they are validated on the way in *and* on the
 * way out: a corrupted storage entry must never reach the renderer.
 */
export const TEMPLATES_KEY = "clipper.templates";

export function defaultTemplates(): ClipTemplate[] {
  return STARTER_TEMPLATES.map((template) => ({ ...template }));
}

/** Validate an untrusted array; invalid entries are dropped, not repaired. */
export function templatesFromStorageValue(value: unknown): ClipTemplate[] {
  if (!Array.isArray(value)) return defaultTemplates();
  const templates: ClipTemplate[] = [];
  for (const entry of value) {
    const result = validateClipTemplate(entry);
    if (result.ok && result.template) templates.push(result.template);
  }
  return templates.length > 0 ? templates : defaultTemplates();
}

export async function loadTemplates(
  area: StorageArea,
): Promise<ClipTemplate[]> {
  const stored = await area.get(TEMPLATES_KEY);
  return templatesFromStorageValue(stored[TEMPLATES_KEY]);
}

export async function saveTemplates(
  area: StorageArea,
  templates: readonly ClipTemplate[],
): Promise<void> {
  const valid: ClipTemplate[] = [];
  for (const template of templates) {
    const result = validateClipTemplate(template);
    if (result.ok && result.template) valid.push(result.template);
  }
  await area.set({ [TEMPLATES_KEY]: valid });
}

/** Fallback when nothing auto-applies and the user has not chosen a template. */
export function fallbackTemplate(): ClipTemplate {
  return { ...ARTICLE_TEMPLATE };
}
