import type { ProtectedSpan } from "./types";

const TOKEN_PREFIX = "\uE000FMT_";
const TOKEN_SUFFIX = "\uE001";

export interface MaskResult {
  maskedText: string;
  spans: ProtectedSpan[];
}

export function maskProtectedRegions(text: string): MaskResult {
  const spans: ProtectedSpan[] = [];
  let working = text;

  const replaceSpan = (raw: string, type: ProtectedSpan["type"]): string => {
    const id = `${TOKEN_PREFIX}${spans.length}${TOKEN_SUFFIX}`;
    spans.push({ id, raw, type });
    return id;
  };

  // 1. Frontmatter at index 0
  if (working.startsWith("---")) {
    const match =
      /^---(?:\r?\n)([\s\S]*?)(?:\r?\n)(?:---|\.\.\.)(?:\r?\n|$)/.exec(working);
    if (match) {
      const raw = match[0];
      const token = replaceSpan(raw, "frontmatter");
      working = token + working.slice(raw.length);
    }
  }

  // 2. Fenced code blocks (``` or ~~~)
  working = working.replace(
    /(?:^|\n)([ \t]*)(```+|~~~+)[^\n]*\n[\s\S]*?\n\1\2[ \t]*(?=\n|$)/g,
    (match) => {
      const startsWithNewline = match.startsWith("\n");
      const codePart = startsWithNewline ? match.slice(1) : match;
      const token = replaceSpan(codePart, "code-block");
      return (startsWithNewline ? "\n" : "") + token;
    },
  );

  // 3. Comments (%% ... %%)
  working = working.replace(/%%[\s\S]*?%%/g, (match) => {
    return replaceSpan(match, "comment");
  });

  // 4. First H1 heading after frontmatter (protect exact bytes to avoid H1 sync churn)
  let foundH1 = false;
  working = working.replace(
    /(?:^|\n)(#[ \t]+[^\n]+)(?=\n|$)/,
    (match, h1Line) => {
      if (foundH1) return match;
      foundH1 = true;
      const startsWithNewline = match.startsWith("\n");
      const token = replaceSpan(h1Line, "h1-title");
      return (startsWithNewline ? "\n" : "") + token;
    },
  );

  // 5. Callout headers: > [!type] ...
  working = working.replace(
    /(?:^|\n)([ \t]*>[ \t]*\[![a-zA-Z0-9_-]+\][^\n]*)/g,
    (match, calloutLine) => {
      const startsWithNewline = match.startsWith("\n");
      const token = replaceSpan(calloutLine, "callout-header");
      return (startsWithNewline ? "\n" : "") + token;
    },
  );

  // 6. Embeds: ![[...]] and Markdown images ![alt](url)
  working = working.replace(/!\[\[[^\]\n]+\]\]/g, (match) => {
    return replaceSpan(match, "embed");
  });
  working = working.replace(/!\[[^\]\n]*\]\([^)\n]+\)/g, (match) => {
    return replaceSpan(match, "embed");
  });

  // 7. Wikilinks: [[note|alias]]
  working = working.replace(/\[\[[^\]\n]+\]\]/g, (match) => {
    return replaceSpan(match, "wikilink");
  });

  // 8. Inline code: `...` or ``...``
  working = working.replace(/(`+)[^`\n]+?\1/g, (match) => {
    return replaceSpan(match, "inline-code");
  });

  // 9. Tags: #tag, #nested/tag (must not follow alphanumeric or another #)
  working = working.replace(
    /(^|[^\w#])(#[a-zA-Z0-9_\-/]+)(?=[^\w#]|$)/g,
    (_match, prefix, tag) => {
      const token = replaceSpan(tag, "tag");
      return prefix + token;
    },
  );

  return { maskedText: working, spans };
}

export function unmaskProtectedRegions(
  maskedText: string,
  spans: ProtectedSpan[],
): string {
  let result = maskedText;
  // Restore in reverse order
  for (let i = spans.length - 1; i >= 0; i -= 1) {
    const span = spans[i]!;
    result = result.replace(span.id, () => span.raw);
  }
  return result;
}
