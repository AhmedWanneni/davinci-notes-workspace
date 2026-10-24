import type { InsertBuildContext, InsertItem } from "./InsertItem";
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
  {
    id: "heading-1",
    group: "Basics",
    label: "Heading 1",
    icon: "TextHOne",
    keywords: ["title", "h1", "heading"],
    build: (context) => block(`# ${field(context, "Heading")}`),
  },
  {
    id: "heading-2",
    group: "Basics",
    label: "Heading 2",
    icon: "TextHTwo",
    keywords: ["subtitle", "h2", "heading"],
    build: (context) => block(`## ${field(context, "Heading")}`),
  },
  {
    id: "heading-3",
    group: "Basics",
    label: "Heading 3",
    icon: "TextHThree",
    keywords: ["h3", "heading"],
    build: (context) => block(`### ${field(context, "Heading")}`),
  },
  {
    id: "bullet-list",
    group: "Basics",
    label: "Bullet list",
    icon: "ListBullets",
    keywords: ["unordered", "list", "bullet"],
    build: (context) => block(`- ${field(context, "Item")}`),
  },
  {
    id: "numbered-list",
    group: "Basics",
    label: "Numbered list",
    icon: "ListNumbers",
    keywords: ["ordered", "list", "number"],
    build: (context) => block(`1. ${field(context, "Item")}`),
  },
  {
    id: "task-list",
    group: "Basics",
    label: "Task list",
    icon: "ListChecks",
    keywords: ["todo", "checklist", "task"],
    build: (context) => block(`- [ ] ${field(context, "Task")}`),
  },
  {
    id: "reminder",
    group: "Basics",
    label: "Reminder",
    icon: "Bell",
    keywords: ["reminder", "due", "date", "time", "todo", "alarm"],
    dialog: {
      kind: "reminder-picker",
      title: "Set Reminder",
      description: "Pick a date and optional time for this reminder.",
      confirmLabel: "Insert Reminder",
    },
    build: (context) => {
      const date = context.input?.date || new Date().toISOString().slice(0, 10);
      const time = context.input?.time ? ` ${context.input.time}` : "";
      return inline(`(@${date}${time})`);
    },
  },
  {
    id: "quote",
    group: "Basics",
    label: "Quote",
    icon: "Quotes",
    keywords: ["blockquote", "citation"],
    build: (context) => block(`> ${field(context, "Quote")}`),
  },
  {
    id: "divider",
    group: "Basics",
    label: "Divider",
    icon: "Minus",
    keywords: ["horizontal rule", "separator", "hr"],
    build: () => block("---"),
  },
  {
    id: "callout",
    group: "Basics",
    label: "Callout",
    icon: "Note",
    keywords: ["note", "admonition", "aside"],
    build: (context) =>
      block(`> [!note] ${field(context, "Title")}\n> \${2:Content}`),
  },
  {
    id: "code-block",
    group: "Code and data",
    label: "Code block",
    icon: "Code",
    keywords: ["fence", "programming", "code"],
    build: (context) => block(`\`\`\`ts\n${field(context, "// code")}\n\`\`\``),
  },
  {
    id: "kanban-board",
    group: "Code and data",
    label: "Kanban board",
    icon: "Table",
    keywords: ["kanban", "board", "lane", "todo", "task", "card", "agile", "data"],
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
    build: () =>
      block(
        "---\nkanban-plugin: board\n---\n\n## To Do\n\n## Doing\n\n## Done\n",
      ),
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
    label: "HTML block",
    icon: "Code",
    keywords: ["html", "div", "markup"],
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
