export function trimTrailingWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");
}

export function collapseBlankLines(text: string): string {
  // Collapse 3 or more consecutive newlines into 2 (i.e. at most 1 blank line between blocks)
  return text.replace(/\n{3,}/g, "\n\n");
}

export function formatStructuralSpacing(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  const isHeading = (l: string) => /^#{1,6}[ \t]+/.test(l.trim());
  const isListItem = (l: string) => /^[ \t]*(?:[*+-]|\d+[.)])[ \t]+/.test(l);
  const isTableLine = (l: string) => l.trim().startsWith("|");
  const isCodeBlockToken = (l: string) => l.includes("\uE000FMT_");
  const isBlank = (l: string) => l.trim() === "";

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i]!;
    const prev = result.length > 0 ? result[result.length - 1]! : null;

    if (isBlank(current)) {
      // Don't add consecutive blank lines
      if (prev !== null && !isBlank(prev)) {
        result.push("");
      }
      continue;
    }

    // Check if we need a blank line before current
    if (prev !== null && !isBlank(prev)) {
      const needBlankBefore =
        (isHeading(current) && !isHeading(prev)) ||
        (isListItem(current) && !isListItem(prev) && !isHeading(prev)) ||
        (isTableLine(current) && !isTableLine(prev)) ||
        (isCodeBlockToken(current) && !isHeading(prev)) ||
        (isCodeBlockToken(prev) && !isHeading(current)) ||
        (!isListItem(current) && isListItem(prev) && !isHeading(current)) ||
        (!isTableLine(current) && isTableLine(prev));

      if (needBlankBefore) {
        result.push("");
      }
    }

    result.push(current);

    // If current is a heading, ensure blank line after if next line is not blank and not a heading
    if (isHeading(current) && i + 1 < lines.length) {
      const next = lines[i + 1]!;
      if (!isBlank(next) && !isHeading(next)) {
        result.push("");
      }
    }
  }

  return result.join("\n");
}
