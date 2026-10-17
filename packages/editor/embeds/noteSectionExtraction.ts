/**
 * Strips markdown emphasis, code markers, and links to normalize heading text
 * for wikilink fragment comparisons.
 */
export function normalizeHeadingText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\*{1,3}|_{1,3}|~~|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ");
}

export interface ExtractedSection {
  found: boolean;
  heading: string;
  level: number;
  content: string;
}

const ATX_HEADING_REGEX = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/;

/**
 * Strips YAML frontmatter from note content if present.
 */
export function stripFrontmatter(content: string): string {
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(content);
  if (!match) return content;
  return content.slice(match[0].length);
}

/**
 * Extracts a heading section from note markdown.
 * A section starts at the matching heading and includes all nested subheadings
 * (level > startLevel), terminating before the next heading of the same or higher
 * level (level <= startLevel) or at the end of the file.
 */
export function extractHeadingSection(
  content: string,
  targetHeading: string,
): ExtractedSection {
  const cleanContent = stripFrontmatter(content);
  const lines = cleanContent.split(/\r?\n/);
  const targetNormalized = normalizeHeadingText(targetHeading);

  let startLine = -1;
  let startLevel = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;

    if (/^(?:```|~~~)/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = ATX_HEADING_REGEX.exec(line);
    if (!match) continue;

    const headingText = match[2]!.trim();
    if (
      headingText.toLowerCase() === targetHeading.trim().toLowerCase() ||
      normalizeHeadingText(headingText) === targetNormalized
    ) {
      startLine = i;
      startLevel = match[1]!.length;
      break;
    }
  }

  if (startLine === -1) {
    return {
      found: false,
      heading: targetHeading,
      level: 0,
      content: "",
    };
  }

  let endLine = lines.length;
  inCodeBlock = false;

  for (let j = startLine + 1; j < lines.length; j += 1) {
    const line = lines[j]!;

    if (/^(?:```|~~~)/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = ATX_HEADING_REGEX.exec(line);
    if (match) {
      const level = match[1]!.length;
      if (level <= startLevel) {
        endLine = j;
        break;
      }
    }
  }

  const sectionLines = lines.slice(startLine, endLine);
  return {
    found: true,
    heading: targetHeading,
    level: startLevel,
    content: sectionLines.join("\n"),
  };
}
