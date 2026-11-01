export interface SubmenuItem {
  id: string;
  label: string;
  snippet: string;
  cursorOffset?: number;
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  badge?: string;
  snippet?: string;
  cursorOffset?: number;
  subitems?: SubmenuItem[];
}

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: "media",
    label: "Media",
    icon: "video",
    subitems: [
      { id: "img-disk", label: "Upload Image from disk...", snippet: "" },
      {
        id: "img-url",
        label: "Image from URL...",
        snippet: "![Image](https://)",
        cursorOffset: 16,
      },
      { id: "video-item", label: "Video / YouTube URL...", snippet: "" },
      {
        id: "audio-item",
        label: "Audio file...",
        snippet: "![Audio](audio.mp3)",
        cursorOffset: 9,
      },
    ],
  },
  {
    id: "lists",
    label: "Lists",
    icon: "list",
    subitems: [
      {
        id: "list-alpha",
        label: "Alphabetic list (a. b. c.)",
        snippet: "\na. First item\nb. Second item\n",
        cursorOffset: 4,
      },
      {
        id: "list-num",
        label: "Numbered list (1. 2. 3.)",
        snippet: "\n1. First item\n2. Second item\n",
        cursorOffset: 4,
      },
      {
        id: "list-bullet",
        label: "Bullet list (•)",
        snippet: "\n- First item\n- Second item\n",
        cursorOffset: 3,
      },
      {
        id: "list-todo",
        label: "Checklist / Todo",
        snippet: "\n- [ ] Task 1\n- [ ] Task 2\n",
        cursorOffset: 7,
      },
    ],
  },
  {
    id: "table",
    label: "Table",
    icon: "table",
    subitems: [
      {
        id: "tbl-2x2",
        label: "2 × 2 Table",
        snippet:
          "\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n",
      },
      {
        id: "tbl-3x3",
        label: "3 × 3 Table",
        snippet:
          "\n| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| A | B | C |\n| D | E | F |\n",
      },
      {
        id: "tbl-4x4",
        label: "4 × 4 Table",
        snippet:
          "\n| C1 | C2 | C3 | C4 |\n| --- | --- | --- | --- |\n| 1 | 2 | 3 | 4 |\n",
      },
    ],
  },
  {
    id: "code",
    label: "Code block",
    icon: "code",
    subitems: [
      {
        id: "code-ts",
        label: "TypeScript / JavaScript",
        snippet: "\n```ts\n// Code\n```\n",
        cursorOffset: 7,
      },
      {
        id: "code-py",
        label: "Python",
        snippet: "\n```py\n# Code\n```\n",
        cursorOffset: 7,
      },
      {
        id: "code-html",
        label: "HTML / XML",
        snippet: "\n```html\n<div>Content</div>\n```\n",
        cursorOffset: 9,
      },
      {
        id: "code-rust",
        label: "Rust",
        snippet: "\n```rust\nfn main() {}\n```\n",
        cursorOffset: 9,
      },
      {
        id: "code-sh",
        label: "Bash / Shell",
        snippet: "\n```bash\n# Shell\n```\n",
        cursorOffset: 9,
      },
    ],
  },
  {
    id: "diagrams",
    label: "Mermaid diagram",
    icon: "browsers",
    badge: "Updated",
    subitems: [
      {
        id: "el-flow",
        label: "Flowchart",
        snippet: "\n```mermaid\nflowchart TD\n  A[Start] --> B[End]\n```\n",
      },
      {
        id: "el-seq",
        label: "Sequence Diagram",
        snippet:
          "\n```mermaid\nsequenceDiagram\n  autonumber\n  User->>Client: Click\n  Client->>Server: Request\n  Server-->>Client: Response\n```\n",
      },
      {
        id: "el-state",
        label: "State Diagram",
        snippet:
          "\n```mermaid\nstateDiagram-v2\n  [*] --> Active\n  Active --> [*]\n```\n",
      },
      {
        id: "el-class",
        label: "Class Diagram",
        snippet:
          "\n```mermaid\nclassDiagram\n  class System {\n    +start()\n  }\n```\n",
      },
      {
        id: "el-er",
        label: "Entity-Relationship (ER)",
        snippet:
          "\n```mermaid\nerDiagram\n  CUSTOMER ||--o{ ORDER : places\n```\n",
      },
    ],
  },
  {
    id: "equation",
    label: "Math equation",
    icon: "equation",
    subitems: [
      {
        id: "eq-block",
        label: "Equation Block",
        snippet: "\n$$\nf(x) = \\int_{-\\infty}^\\infty e^{-x^2} dx\n$$\n",
        cursorOffset: 4,
      },
      {
        id: "eq-inline",
        label: "Inline Formula",
        snippet: "$E = mc^2$",
        cursorOffset: 1,
      },
    ],
  },
  {
    id: "symbols",
    label: "Callouts",
    icon: "symbols",
    subitems: [
      {
        id: "sym-note",
        label: "Callout Note",
        snippet: "\n> [!NOTE]\n> Note text\n",
        cursorOffset: 11,
      },
      {
        id: "sym-tip",
        label: "Callout Tip",
        snippet: "\n> [!TIP]\n> Pro tip\n",
        cursorOffset: 10,
      },
      {
        id: "sym-warn",
        label: "Callout Warning",
        snippet: "\n> [!WARNING]\n> Warning text\n",
        cursorOffset: 14,
      },
      {
        id: "sym-important",
        label: "Callout Important",
        snippet: "\n> [!IMPORTANT]\n> Important details\n",
        cursorOffset: 16,
      },
    ],
  },
  {
    id: "divider-1",
    label: "---",
    icon: "divider",
  },
  {
    id: "link",
    label: "Link",
    icon: "link",
    shortcut: "⌘K",
    snippet: "[[Link target]]",
    cursorOffset: 2,
  },
  {
    id: "hr",
    label: "Horizontal line",
    icon: "minus",
    snippet: "\n---\n",
  },
  {
    id: "kanban",
    label: "Kanban Board",
    icon: "browsers",
    snippet:
      "\n```kanban\n# Todo\n- Task 1\n# In Progress\n- Task 2\n# Done\n- Task 3\n```\n",
  },
  {
    id: "divider-2",
    label: "---",
    icon: "divider",
  },
  {
    id: "comment",
    label: "Comment",
    icon: "chat",
    shortcut: "⌘+Option+M",
    snippet: "%% Comment %%",
    cursorOffset: 3,
  },
];
