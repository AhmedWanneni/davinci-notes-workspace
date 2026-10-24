const FRONTMATTER_REGEX = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/;
const METADATA_KEYS_REGEX =
  /^(cover|cover_y|coverY|banner|banner_y|bannerY|icon):\s*.*(?:\r?\n|$)/gm;

/**
 * Strips cover and icon keys from note content frontmatter so they are never
 * shown or added inside the editor text area.
 */
export function stripNoteMetadata(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) return raw;

  const opening = match[1] ?? "---\n";
  const yaml = match[2] ?? "";
  const closing = match[3] ?? "\n---\n";
  const body = raw.slice(match[0].length);

  const nextYaml = yaml.replace(METADATA_KEYS_REGEX, "");
  const trimmedYaml = nextYaml.trim();
  if (!trimmedYaml) {
    return body;
  }
  return `${opening}${trimmedYaml}\n---\n${body}`;
}
