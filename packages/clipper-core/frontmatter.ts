import type { ClipPropertyValue } from "./ClipPayload.js";

/**
 * Minimal, injection-proof YAML frontmatter emitter.
 *
 * Values come from a web page, so the emitter never trusts them: anything that
 * could change the YAML *structure* (newlines, `---`, quotes, leading markers)
 * is double-quoted and escaped, and a value that renders empty is still emitted
 * as an explicit empty string so a broken template is visible, not silent.
 */

const PLAIN_SAFE = /^[A-Za-z0-9_][A-Za-z0-9 _./-]*$/;

/** Words YAML 1.1 would coerce away from a string. */
const RESERVED_WORDS = new Set([
  "true",
  "false",
  "null",
  "yes",
  "no",
  "on",
  "off",
  "~",
]);

function isPlainSafe(value: string): boolean {
  if (value.length === 0) return false;
  if (!PLAIN_SAFE.test(value)) return false;
  if (value !== value.trim()) return false;
  if (RESERVED_WORDS.has(value.toLowerCase())) return false;
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(value)) return false;
  return true;
}

export function yamlScalar(value: string): string {
  if (isPlainSafe(value)) return value;
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

function emitValue(name: string, value: ClipPropertyValue): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${yamlScalar(name)}: []`];
    return [
      `${yamlScalar(name)}:`,
      ...value.map((item) => `  - ${yamlScalar(String(item))}`),
    ];
  }
  if (typeof value === "number") return [`${yamlScalar(name)}: ${value}`];
  return [`${yamlScalar(name)}: ${yamlScalar(String(value))}`];
}

export function renderFrontmatter(
  properties: Record<string, ClipPropertyValue>,
  tags: string[] = [],
): string {
  const lines: string[] = [];

  for (const [name, value] of Object.entries(properties)) {
    // `tags` is a dedicated payload field; a template property of the same name
    // must not produce a second key in the block.
    if (name === "tags") continue;
    lines.push(...emitValue(name, value));
  }

  const uniqueTags: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length > 0 && !uniqueTags.includes(trimmed))
      uniqueTags.push(trimmed);
  }
  if (uniqueTags.length > 0) lines.push(...emitValue("tags", uniqueTags));

  if (lines.length === 0) return "";
  return `---\n${lines.join("\n")}\n---\n`;
}
