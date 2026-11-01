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
    id: "image",
    label: "Image",
    icon: "image",
    subitems: [
      { id: "img-disk", label: "Upload from disk...", snippet: "" },
      {
        id: "img-url",
        label: "From web URL...",
        snippet: "![Image description](https://)",
        cursorOffset: 21,
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
        snippet: "\n```ts\n// TypeScript\n```\n",
        cursorOffset: 7,
      },
      {
        id: "code-py",
        label: "Python",
        snippet: "\n```py\n# Python\n```\n",
        cursorOffset: 7,
      },
      {
        id: "code-sh",
        label: "Bash / Shell",
        snippet: "\n```bash\n# Shell command\n```\n",
        cursorOffset: 9,
      },
    ],
  },
  {
    id: "video",
    label: "Video",
    icon: "video",
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
    id: "symbols",
    label: "Symbols",
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
    ],
  },
  {
    id: "equation",
    label: "Equation",
    icon: "equation",
    snippet: "\n$$\nf(x) = \\int_{-\\infty}^\\infty\n$$\n",
    cursorOffset: 4,
  },
  {
    id: "divider-1",
    label: "---",
    icon: "divider",
  },
  {
    id: "hr",
    label: "Horizontal line",
    icon: "minus",
    snippet: "\n---\n",
  },
  {
    id: "page",
    label: "Page elements",
    icon: "browsers",
    badge: "Updated",
    subitems: [
      {
        id: "el-flow",
        label: "Mermaid Flowchart",
        snippet:
          "\n```mermaid\nflowchart TD\n  A[Start] --> B(Process)\n  B --> C[End]\n```\n",
      },
      {
        id: "el-seq",
        label: "Mermaid Sequence Diagram",
        snippet:
          "\n```mermaid\nsequenceDiagram\n  autonumber\n  User->>Client: Click action\n  Client->>Server: POST /api/data\n  Server-->>Client: 200 OK\n```\n",
      },
      {
        id: "el-kanban",
        label: "Kanban Board",
        snippet:
          "\n```kanban\n# Todo\n- Task 1\n# In Progress\n- Task 2\n# Done\n- Task 3\n```\n",
      },
    ],
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
