const LIST_ITEM_REGEX =
  /^([ \t]*)([*+-]|\d+[.)])([ \t]+)(?:\[([ xX\-_/])\][ \t]+)?(.*)$/;

export function formatListLine(line: string): string {
  // If line is empty or purely whitespace, don't format as list item
  if (!line.trim()) return line;

  // Support blockquote lists, e.g. "> - item"
  let prefix = "";
  let content = line;
  const quoteMatch = /^([ \t]*>[ \t]*)(.*)$/.exec(line);
  if (quoteMatch) {
    prefix = quoteMatch[1]!;
    content = quoteMatch[2]!;
  }

  const match = LIST_ITEM_REGEX.exec(content);
  if (!match) return line;

  const rawIndent = match[1] ?? "";
  const rawMarker = match[2] ?? "-";
  const checkbox = match[4];
  const itemText = match[5] ?? "";

  // Convert tabs to 2 spaces for calculation
  const spaceCount = rawIndent.replace(/\t/g, "  ").length;
  // Normalize to 2-space increments (0, 2, 4, 6...)
  const normalizedLevel = Math.round(spaceCount / 2);
  const normalizedIndent = "  ".repeat(normalizedLevel);

  // Normalize unordered markers (* or +) to -
  let normalizedMarker = rawMarker;
  if (rawMarker === "*" || rawMarker === "+") {
    normalizedMarker = "-";
  }

  // Format checkbox if present
  let checkboxPart = "";
  if (checkbox !== undefined) {
    const mark = checkbox === "X" ? "x" : checkbox;
    checkboxPart = `[${mark}] `;
  }

  return `${prefix}${normalizedIndent}${normalizedMarker} ${checkboxPart}${itemText}`;
}

export function formatMarkdownLists(text: string): string {
  const lines = text.split("\n");
  const formattedLines = lines.map((line) => {
    // Only format lines that look like list items
    if (/^[ \t]*(?:>[ \t]*)?(?:[*+-]|\d+[.)])[ \t]+/.test(line)) {
      return formatListLine(line);
    }
    return line;
  });
  return formattedLines.join("\n");
}
