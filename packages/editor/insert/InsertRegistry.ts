import type { InsertBuildContext, InsertItem } from "./InsertItem";
import { diagramItems } from "./diagrams";
import {
  validateImageUrl,
  validateYoutubeUrl,
  validateTweetUrl,
} from "./mediaValidation";

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
    id: "image",
    group: "Media",
    label: "Image",
    icon: "Image",
    keywords: ["image", "picture", "photo", "img", "media"],
    dialog: {
      kind: "image-sources",
      title: "Insert Image",
      description: "Choose a local file to import or provide an image URL.",
      placeholder: "https://example.com/image.png",
      confirmLabel: "Insert Image",
      validate: (input) => {
        if (input.path) return null;
        if (!input.url) return "Please choose a file or enter an image URL.";
        return validateImageUrl(input.url);
      },
    },
    build: (context) => {
      if (context.input?.path) {
        return block(`![[${context.input.path}]]`);
      }
      const url = context.input?.url || "https://";
      return block(`![](${url})`);
    },
  },
  {
    id: "youtube",
    group: "Media",
    label: "YouTube",
    icon: "VideoCamera",
    keywords: ["youtube", "video", "yt", "media"],
    dialog: {
      kind: "media-url",
      title: "Insert YouTube Video",
      description: "Enter a YouTube watch or youtu.be URL.",
      placeholder: "https://www.youtube.com/watch?v=...",
      confirmLabel: "Insert Video",
      validate: (input) => {
        if (!input.url) return "URL cannot be empty.";
        return validateYoutubeUrl(input.url);
      },
    },
    build: (context) => {
      const url = context.input?.url || "https://youtube.com/watch?v=";
      return block(`![](${url})`);
    },
  },
  {
    id: "tweet",
    group: "Media",
    label: "Tweet / X",
    icon: "TwitterLogo",
    keywords: ["tweet", "twitter", "x", "post", "social", "media"],
    dialog: {
      kind: "media-url",
      title: "Insert Tweet / X Post",
      description: "Enter an X or Twitter post URL.",
      placeholder: "https://x.com/username/status/...",
      confirmLabel: "Insert Post",
      validate: (input) => {
        if (!input.url) return "URL cannot be empty.";
        return validateTweetUrl(input.url);
      },
    },
    build: (context) => {
      const url = context.input?.url || "https://x.com/";
      return block(`![](${url})`);
    },
  },
  ...diagramItems,
];

export function findInsertItem(id: string) {
  return insertRegistry.find((item) => item.id === id);
}
