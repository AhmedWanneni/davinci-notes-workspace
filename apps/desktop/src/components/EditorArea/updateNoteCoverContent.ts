const FRONTMATTER_REGEX = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/;
const COVER_REGEX = /^(cover|banner):\s*.*(?:\r?\n|$)/m;
const COVER_Y_REGEX = /^(cover_y|banner_y|coverY|bannerY):\s*.*(?:\r?\n|$)/m;

/**
 * Updates or removes cover and vertical position (cover_y) in note frontmatter,
 * preserving all existing comments, whitespace, and unrelated properties.
 */
export function updateNoteCoverContent(
  raw: string,
  cover: string | null,
  coverY?: number | null,
): string {
  const match = raw.match(FRONTMATTER_REGEX);

  if (!match) {
    if (cover === null) return raw;
    const yLine =
      coverY !== undefined && coverY !== null ? `cover_y: ${coverY}\n` : "";
    return `---\ncover: ${JSON.stringify(cover)}\n${yLine}---\n${raw}`;
  }

  const opening = match[1] ?? "---\n";
  const yaml = match[2] ?? "";
  const closing = match[3] ?? "\n---\n";
  const body = raw.slice(match[0].length);

  // If removing cover
  if (cover === null) {
    let nextYaml = yaml.replace(COVER_REGEX, "").replace(COVER_Y_REGEX, "");
    if (!nextYaml.trim()) {
      return body;
    }
    return `${opening}${nextYaml}${closing}${body}`;
  }

  // Preserve existing "banner" key naming if user or Obsidian used it
  const bannerMatch = yaml.match(COVER_REGEX);
  const coverKey = bannerMatch?.[1] === "banner" ? "banner" : "cover";
  const yKey = coverKey === "banner" ? "banner_y" : "cover_y";

  const coverLine = `${coverKey}: ${JSON.stringify(cover)}\n`;
  let nextYaml = COVER_REGEX.test(yaml)
    ? yaml.replace(COVER_REGEX, coverLine)
    : `${coverLine}${yaml}`;

  if (coverY !== undefined && coverY !== null) {
    const yLine = `${yKey}: ${coverY}\n`;
    nextYaml = COVER_Y_REGEX.test(nextYaml)
      ? nextYaml.replace(COVER_Y_REGEX, yLine)
      : `${nextYaml}${yLine}`;
  } else if (coverY === null) {
    nextYaml = nextYaml.replace(COVER_Y_REGEX, "");
  }

  return `${opening}${nextYaml}${closing}${body}`;
}
