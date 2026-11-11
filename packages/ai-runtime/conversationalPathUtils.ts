export const INVALID_WORDS = new Set([
  "having",
  "hacing",
  "with",
  "about",
  "for",
  "in",
  "on",
  "at",
  "to",
  "from",
  "of",
  "by",
  "containing",
  "listing",
  "including",
  "summarizing",
  "called",
  "named",
  "titled",
  "that",
  "which",
  "a",
  "an",
  "the",
  "some",
  "all",
  "any",
  "and",
  "or",
  "but",
  "this",
  "my",
  "your",
  "it",
  "them",
]);

export function cleanPath(raw: string, isFolder = false): string {
  let cleaned = raw
    .trim()
    .replace(/^["'‘“]+|["'’”]+$/g, "")
    .replace(/^\/+|\/+$/g, "");
  if (!isFolder && !cleaned.toLowerCase().endsWith(".md")) {
    cleaned = `${cleaned}.md`;
  }
  return cleaned;
}
