import type { InsertBuildContext, InsertItem } from "./InsertItem";

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

export const basicItems: readonly InsertItem[] = [
  {
    id: "ai-meeting-notes",
    group: "Basics",
    label: "AI Meeting Notes",
    icon: "Note",
    keywords: ["ai", "meeting", "notes", "agenda", "discussion", "minutes"],
    build: () =>
      block(
        `# Meeting Notes: \${1:Topic}\n**Date:** @today | **Participants:** \${2:Names}\n\n## Agenda\n- [ ] \${3:Item}\n\n## Key Discussion Points\n- \${4:Point}\n\n## Action Items\n- [ ] \${5:Action item}`,
      ),
  },
  {
    id: "text",
    group: "Basics",
    label: "Text",
    icon: "TextT",
    keywords: ["text", "paragraph", "plain", "body"],
    build: (context) => block(field(context, "Text")),
  },
  {
    id: "heading-1",
    group: "Basics",
    label: "Heading 1",
    shortcut: "#",
    icon: "TextHOne",
    keywords: ["title", "h1", "heading"],
    build: (context) => block(`# ${field(context, "Heading")}`),
  },
  {
    id: "heading-2",
    group: "Basics",
    label: "Heading 2",
    shortcut: "##",
    icon: "TextHTwo",
    keywords: ["subtitle", "h2", "heading"],
    build: (context) => block(`## ${field(context, "Heading")}`),
  },
  {
    id: "heading-3",
    group: "Basics",
    label: "Heading 3",
    shortcut: "###",
    icon: "TextHThree",
    keywords: ["h3", "heading"],
    build: (context) => block(`### ${field(context, "Heading")}`),
  },
  {
    id: "bullet-list",
    group: "Basics",
    label: "Bullet list",
    shortcut: "-",
    icon: "ListBullets",
    keywords: ["unordered", "list", "bullet"],
    build: (context) => block(`- ${field(context, "Item")}`),
  },
  {
    id: "numbered-list",
    group: "Basics",
    label: "Numbered list",
    shortcut: "1.",
    icon: "ListNumbers",
    keywords: ["ordered", "list", "number"],
    build: (context) => block(`1. ${field(context, "Item")}`),
  },
  {
    id: "task-list",
    group: "Basics",
    label: "Task list",
    shortcut: "[]",
    icon: "ListChecks",
    keywords: ["todo", "checklist", "task"],
    build: (context) => block(`- [ ] ${field(context, "Task")}`),
  },
  {
    id: "reminder",
    group: "Basics",
    label: "Reminder",
    shortcut: "@",
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
    shortcut: ">",
    icon: "Quotes",
    keywords: ["blockquote", "citation"],
    build: (context) => block(`> ${field(context, "Quote")}`),
  },
  {
    id: "divider",
    group: "Basics",
    label: "Divider",
    shortcut: "---",
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
];
