import { validateClipTemplate, type ClipTemplate } from "@app/clipper-core";

/** A template export is deliberately bounded before JSON parsing. */
export const MAX_TEMPLATE_IMPORT_BYTES = 1024 * 1024;

export type TemplateImportResult =
  { ok: true; templates: ClipTemplate[] } | { ok: false; error: string };

/**
 * Parse a complete template export. Unlike storage recovery, import is atomic:
 * one invalid entry leaves the currently stored library untouched.
 */
export function parseTemplateImport(text: string): TemplateImportResult {
  if (new TextEncoder().encode(text).byteLength > MAX_TEMPLATE_IMPORT_BYTES) {
    return {
      ok: false,
      error: `The import is larger than ${MAX_TEMPLATE_IMPORT_BYTES / 1024 / 1024} MiB.`,
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "The import is not valid JSON." };
  }
  if (!Array.isArray(value) || value.length === 0) {
    return {
      ok: false,
      error: "The import must be a non-empty template array.",
    };
  }

  const templates: ClipTemplate[] = [];
  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    if (hasUnsafeLiteralFolder(entry)) {
      return {
        ok: false,
        error: `Template ${index + 1}: folder must stay inside the vault.`,
      };
    }
    const result = validateClipTemplate(entry);
    if (!result.ok || result.template === undefined) {
      return {
        ok: false,
        error: `Template ${index + 1}: ${result.errors.join("; ")}.`,
      };
    }
    if (ids.has(result.template.id)) {
      return {
        ok: false,
        error: `Template ${index + 1} repeats an existing id.`,
      };
    }
    ids.add(result.template.id);
    templates.push(result.template);
  }
  return { ok: true, templates };
}

function hasUnsafeLiteralFolder(entry: unknown): boolean {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return false;
  }
  const folder = (entry as Record<string, unknown>).folder;
  if (typeof folder !== "string") return false;
  return (
    folder.startsWith("/") ||
    folder.includes("\\") ||
    folder.split("/").some((segment) => segment === "." || segment === "..")
  );
}

/** Export the stored order because it decides the first matching auto-apply rule. */
export function serializeTemplateExport(
  templates: readonly ClipTemplate[],
): string {
  return `${JSON.stringify(templates, null, 2)}\n`;
}
