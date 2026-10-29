export function isDatabaseNote(text: string): boolean {
  if (!text || !text.startsWith("---")) return false;
  const endFm = text.indexOf("\n---", 3);
  if (endFm === -1) return false;
  const fm = text.slice(3, endFm);
  return /(?:^|\n)\s*database\s*:\s*["']?table["']?\s*(?:\r?\n|$)/.test(fm);
}
