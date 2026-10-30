/**
 * Returns true if raw note text contains YAML frontmatter with `kanban-plugin: board`.
 */
export function isKanbanBoard(text: string): boolean {
  if (!text) return false;
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return false;
  const yaml = match[1];
  return /(?:^|\n)\s*kanban-plugin\s*:\s*["']?board["']?\s*(?:\r?\n|$)/.test(
    yaml,
  );
}
