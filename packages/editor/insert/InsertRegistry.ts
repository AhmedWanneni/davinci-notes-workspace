import type { InsertBuildContext, InsertItem } from "./InsertItem";
import { basicItems } from "./basicItems";
import { diagramItems } from "./diagrams";
import { mediaItems } from "./mediaItems";

function escapeSnippetText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/}/g, "\\}");
}

function field(context: InsertBuildContext, fallback: string, number = 1) {
  const value = context.selectedText || fallback;
  return `\${${number}:${escapeSnippetText(value)}}`;
}

function block(text: string) {
  return { text, block: true };
}

function inline(text: string) {
  return { text, block: false };
}

export const insertRegistry: readonly InsertItem[] = [
  ...basicItems,
  {
    id: "code-block",
    group: "Code and data",
    label: "Code block",
    shortcut: "```",
    icon: "Code",
    keywords: ["fence", "programming", "code"],
    build: (context) => block(`\`\`\`ts\n${field(context, "// code")}\n\`\`\``),
  },
  {
    id: "kanban-board",
    group: "Code and data",
    label: "Kanban board",
    icon: "Table",
    keywords: [
      "kanban",
      "board",
      "lane",
      "todo",
      "task",
      "card",
      "agile",
      "data",
    ],
    dialog: {
      kind: "kanban-creator",
      title: "New Kanban Board",
      description: "Enter a title for the new kanban board note.",
      confirmLabel: "Create Board",
      validate: (input) => {
        const name = (input.name as string)?.trim();
        if (!name) return "Please enter a board name.";
        return null;
      },
    },
    build: (context) => {
      const title = context?.selectedText?.trim() || "Kanban Board";
      return block(
        `---\nkanban-plugin: board\n---\n\n# ${title}\n\n## To Do\n\n## Doing\n\n## Done\n`,
      );
    },
  },
  {
    id: "database-table",
    group: "Code and data",
    label: "Database table",
    icon: "Table",
    keywords: ["database", "table", "notion", "grid", "data", "columns"],
    dialog: {
      kind: "database-creator",
      title: "New Database Table",
      description: "Enter a title for the new database note.",
      confirmLabel: "Create Table",
      validate: (input) =>
        (input.name as string)?.trim() ? null : "Please enter a table name.",
    },
    build: (context) => {
      const title = context?.selectedText?.trim() || "Database Table";
      return block(
        `---\ndatabase: table\ncolumns:\n  - name: Name\n    type: text\n  - name: Status\n    type: select\n    options:\n      - { value: Todo, color: blue }\n      - { value: In Progress, color: orange }\n      - { value: Done, color: green }\n  - name: Done\n    type: checkbox\n---\n\n| Name | Status | Done |\n|---|---|---|\n| ${title} | Todo | false |\n`,
      );
    },
  },
  {
    id: "table",
    group: "Code and data",
    label: "Table",
    icon: "Table",
    keywords: ["grid", "columns", "data"],
    build: () =>
      block(
        "| ${1:Header 1} | ${2:Header 2} | ${3:Header 3} |\n| --- | --- | --- |\n| ${4:Cell 1} | ${5:Cell 2} | ${6:Cell 3} |\n| ${7:Cell 4} | ${8:Cell 5} | ${9:Cell 6} |\n| ${10:Cell 7} | ${11:Cell 8} | ${12:Cell 9} |",
      ),
  },
  {
    id: "math-block",
    group: "Code and data",
    label: "Math block",
    icon: "MathOperations",
    keywords: ["latex", "equation", "formula", "math"],
    build: (context) => block(`$$\n${field(context, "x^2")}\n$$`),
  },
  {
    id: "footnote",
    group: "Code and data",
    label: "Footnote",
    icon: "TextT",
    keywords: ["reference", "citation", "note"],
    build: (context) =>
      block(
        `[^${field(context, "1")}]\n\n[^${field(context, "1")}]: \${2:Footnote}`,
      ),
  },
  {
    id: "html-block",
    group: "HTML",
    label: "HTML · Embeds",
    badge: "New",
    icon: "Code",
    keywords: ["html", "div", "markup", "embeds", "embed"],
    build: (context) => block(`<div>\n  ${field(context, "Content")}\n</div>`),
  },
  {
    id: "html-inline",
    group: "HTML",
    label: "Inline HTML",
    icon: "Function",
    keywords: ["html", "span", "markup", "inline"],
    build: (context) => inline(`<span>${field(context, "Text")}</span>`),
  },
  {
    id: "note-embed",
    group: "Links",
    label: "Note embed",
    icon: "Note",
    keywords: ["embed", "note", "transclusion", "wikilink", "link"],
    dialog: {
      kind: "note-picker",
      title: "Embed Note",
      description: "Search notes by title and optionally select a heading.",
      confirmLabel: "Embed Note",
      validate: (input) => {
        if (!input.path && !input.target) {
          return "Please choose a note to embed.";
        }
        return null;
      },
    },
    build: (context) => {
      const target = context.input?.target || context.input?.path || "Note";
      const heading = context.input?.heading ? `#${context.input.heading}` : "";
      return block(`![[${target}${heading}]]`);
    },
  },
  ...mediaItems,
  ...diagramItems,
];

export function findInsertItem(id: string) {
  return insertRegistry.find((item) => item.id === id);
}
