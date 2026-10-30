const WIKILINK_EMBED_PATTERN = /!\[\[([^\]]+)\]\]/;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)\)/;

export function updateEmbedWidthInText(
  text: string,
  width: number | undefined,
): string {
  const wikiMatch = WIKILINK_EMBED_PATTERN.exec(text);
  if (wikiMatch) {
    const fullMatch = wikiMatch[0];
    const inner = wikiMatch[1]!;
    const parts = inner.split("|");
    const target = parts[0]!;
    const remaining = parts.slice(1);

    // Filter out existing trailing dimension specifier (e.g. "300" or "640x480")
    const nonDimParts = remaining.filter(
      (part, idx) =>
        !(idx === remaining.length - 1 && /^\d+(?:x\d+)?$/i.test(part.trim())),
    );

    let newInner: string;
    if (width !== undefined && width > 0) {
      newInner = [target, ...nonDimParts, String(Math.round(width))].join("|");
    } else {
      newInner = [target, ...nonDimParts].join("|");
    }

    const replacement = `![[${newInner}]]`;
    return text.replace(fullMatch, replacement);
  }

  const mdMatch = MARKDOWN_IMAGE_PATTERN.exec(text);
  if (mdMatch) {
    const fullMatch = mdMatch[0];
    const rawAlt = mdMatch[1]!;
    const url = mdMatch[2]!;

    const altParts = rawAlt.split("|");
    const nonDimAltParts = altParts.filter(
      (part, idx) =>
        !(idx === altParts.length - 1 && /^\d+(?:x\d+)?$/i.test(part.trim())),
    );

    let newAlt: string;
    if (width !== undefined && width > 0) {
      newAlt = [...nonDimAltParts, String(Math.round(width))]
        .filter(Boolean)
        .join("|");
    } else {
      newAlt = nonDimAltParts.join("|");
    }

    const replacement = `![${newAlt}](${url})`;
    return text.replace(fullMatch, replacement);
  }

  return text;
}
