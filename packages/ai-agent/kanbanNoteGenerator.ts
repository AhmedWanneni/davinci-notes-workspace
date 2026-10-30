export interface KanbanLaneDef {
  name: string;
  cards?: string[];
}

export interface KanbanBoardDef {
  title?: string;
  lanes?: KanbanLaneDef[];
}

const DEFAULT_LANES: KanbanLaneDef[] = [
  { name: "To Do", cards: [] },
  { name: "Doing", cards: [] },
  { name: "Done", cards: [] },
];

/**
 * Generates Markdown compatible with Obsidian Kanban plugin (`kanban-plugin: board`).
 */
export function generateKanbanMarkdown(def: KanbanBoardDef): string {
  const title = def.title?.trim() || "Kanban Board";
  const lanes = def.lanes && def.lanes.length > 0 ? def.lanes : DEFAULT_LANES;

  const lines: string[] = [
    "---",
    "kanban-plugin: board",
    "---",
    "",
    `# ${title}`,
    "",
  ];

  for (const lane of lanes) {
    const laneName = lane.name.trim();
    lines.push(`## ${laneName}`);
    if (lane.cards && lane.cards.length > 0) {
      for (const card of lane.cards) {
        lines.push(`- [ ] ${card.trim()}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
