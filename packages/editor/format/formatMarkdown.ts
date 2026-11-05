import type { FormatMarkdownOptions, FormatMarkdownResult } from "./types";
import {
  maskProtectedRegions,
  unmaskProtectedRegions,
} from "./protectedRegions";
import { formatMarkdownTables } from "./tableFormatter";
import { formatMarkdownLists } from "./listFormatter";
import {
  trimTrailingWhitespace,
  collapseBlankLines,
  formatStructuralSpacing,
} from "./spacingFormatter";

export function formatMarkdown(
  text: string,
  options: FormatMarkdownOptions = {},
): FormatMarkdownResult {
  if (!text) {
    return { formatted: "", changed: false };
  }

  const { insertFinalNewline = true } = options;

  // 1. Mask protected regions
  const { maskedText, spans } = maskProtectedRegions(text);

  // 2. Trim trailing whitespace on all lines
  let working = trimTrailingWhitespace(maskedText);

  // 3. Format tables
  working = formatMarkdownTables(working);

  // 4. Format lists
  working = formatMarkdownLists(working);

  // 5. Format structural spacing (headings, lists, tables, code blocks)
  working = formatStructuralSpacing(working);

  // 6. Collapse any extra blank lines (3+ into 1 blank line)
  working = collapseBlankLines(working);

  // 7. Unmask protected regions
  let formatted = unmaskProtectedRegions(working, spans);

  // 8. Trim any final trailing whitespace created by unmasking, and ensure single trailing newline
  formatted = trimTrailingWhitespace(formatted);
  if (insertFinalNewline && formatted.length > 0 && !formatted.endsWith("\n")) {
    formatted += "\n";
  }

  return {
    formatted,
    changed: formatted !== text,
  };
}
