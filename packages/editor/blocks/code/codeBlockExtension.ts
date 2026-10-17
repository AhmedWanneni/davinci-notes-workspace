import { javascriptLanguage } from "@codemirror/lang-javascript";
import type { Language } from "@codemirror/language";

const javascriptAliases = new Set([
  "js",
  "jsx",
  "javascript",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "typescript",
]);

/** Resolves the intentionally small initial fenced-code language coverage. */
export function codeBlockLanguage(info: string): Language | null {
  const language = info.trim().split(/\s+/, 1)[0]?.toLowerCase();
  return language && javascriptAliases.has(language)
    ? javascriptLanguage
    : null;
}
