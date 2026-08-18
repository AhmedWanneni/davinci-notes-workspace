import { parseFrontmatter } from "@app/indexer";

/** First markdown H1 in the note body (after frontmatter), or null. */
export function extractH1Title(content: string): string | null {
  const { content: body } = parseFrontmatter(content);
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(/^#\s+(.+?)\s*$/);
    if (match) {
      return match[1].trim();
    }
    break;
  }
  return null;
}
