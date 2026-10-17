import type { InsertBuildContext, InsertBuildResult } from "../InsertItem";

function escapeSnippet(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/}/g, "\\}");
}

export function field(
  index: number,
  fallback: string,
  context?: InsertBuildContext,
): string {
  const value =
    index === 1 && context?.selectedText ? context.selectedText : fallback;
  return `\${${index}:${escapeSnippet(value)}}`;
}

export function wrapMermaid(body: string): InsertBuildResult {
  return {
    text: `\`\`\`mermaid\n${body}\n\`\`\``,
    block: true,
  };
}

export function resolveSnippetPlaceholders(template: string): string {
  return template.replace(/\$\{\d+:([^}]+)\}/gu, "$1");
}
