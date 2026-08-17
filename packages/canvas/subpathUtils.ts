export interface MarkdownHeading {
  level: number;
  text: string;
  rawHeading: string;
  lineIndex: number;
}

/**
 * Normalizes heading target by removing leading `#`, markdown styling, and whitespace.
 */
export function normalizeHeadingTarget(subpath: string): string {
  return subpath
    .replace(/^#+/, "")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Extract all markdown headings (H1-H6), skipping code blocks.
 */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];

  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```") || line.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawHeading = match[2].trim();
      const text = rawHeading
        .replace(/\[\[(.*?)\]\]/g, "$1")
        .replace(/[*_`~]/g, "")
        .trim();

      headings.push({
        level,
        text,
        rawHeading,
        lineIndex: i,
      });
    }
  }

  return headings;
}

/**
 * Extract a section of markdown text corresponding to a specific heading subpath.
 * Captures from the target heading up to the next heading of same or higher level.
 */
export function extractSectionByHeading(
  markdown: string,
  subpath?: string,
): string {
  if (!markdown || !subpath) return markdown;

  const target = normalizeHeadingTarget(subpath);
  if (!target) return markdown;

  const lines = markdown.split(/\r?\n/);
  const headings = extractHeadings(markdown);

  const targetIndex = headings.findIndex(
    (h) =>
      h.text.toLowerCase() === target ||
      normalizeHeadingTarget(h.rawHeading) === target,
  );

  if (targetIndex === -1) return markdown;

  const matchedHeading = headings[targetIndex];
  const startLine = matchedHeading.lineIndex;

  // Find ending line: next heading with level <= matchedHeading.level
  let endLine = lines.length;
  for (let i = targetIndex + 1; i < headings.length; i++) {
    if (headings[i].level <= matchedHeading.level) {
      endLine = headings[i].lineIndex;
      break;
    }
  }

  return lines.slice(startLine, endLine).join("\n").trim();
}
