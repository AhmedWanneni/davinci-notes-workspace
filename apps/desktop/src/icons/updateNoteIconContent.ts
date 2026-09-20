const frontmatter = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/;
const iconLine = /^icon:\s*.*(?:\r?\n|$)/m;

/**
 * Changes only the top-level `icon` line, retaining all unrelated YAML bytes.
 * Values are JSON quoted to remain valid YAML for every emoji sequence.
 */
export function updateNoteIconContent(
  raw: string,
  icon: string | null,
): string {
  const match = raw.match(frontmatter);
  if (!match) {
    return icon === null
      ? raw
      : `---\nicon: ${JSON.stringify(icon)}\n---\n${raw}`;
  }

  const opening = match[1] ?? "---\n";
  const yaml = match[2] ?? "";
  const closing = match[3] ?? "\n---\n";
  const replacement = icon === null ? "" : `icon: ${JSON.stringify(icon)}\n`;
  const nextYaml = iconLine.test(yaml)
    ? yaml.replace(iconLine, replacement)
    : `${replacement}${yaml}`;

  return `${opening}${nextYaml}${closing}${raw.slice(match[0].length)}`;
}
