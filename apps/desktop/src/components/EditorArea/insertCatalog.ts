export interface InsertCatalogItem {
  id: string;
  category: "diagrams" | "tables" | "callouts" | "media" | "code";
  title: string;
  description: string;
  template: string;
  cursorOffset?: number;
}

export interface InsertCategoryDef {
  id: "all" | "diagrams" | "tables" | "callouts" | "media" | "code";
  label: string;
}

export const INSERT_CATEGORIES: InsertCategoryDef[] = [
  { id: "all", label: "All" },
  { id: "diagrams", label: "Mermaid Diagrams" },
  { id: "tables", label: "Tables" },
  { id: "callouts", label: "Callouts" },
  { id: "media", label: "Media & Math" },
  { id: "code", label: "Code" },
];

export const INSERT_CATALOG_ITEMS: InsertCatalogItem[] = [
  // --- Mermaid Diagrams ---
  {
    id: "mermaid-flowchart-lr",
    category: "diagrams",
    title: "Flowchart (Left to Right)",
    description: "Process diagram with step nodes and decision branch",
    template:
      "```mermaid\nflowchart LR\n  A[Start] --> B{Decision}\n  B -- Yes --> C[Result A]\n  B -- No --> D[Result B]\n```\n",
  },
  {
    id: "mermaid-flowchart-td",
    category: "diagrams",
    title: "Flowchart (Top Down)",
    description: "Hierarchical top-to-bottom flowchart",
    template:
      "```mermaid\nflowchart TD\n  Start([Start]) --> Step1[Step 1]\n  Step1 --> Step2[Step 2]\n  Step2 --> End([End])\n```\n",
  },
  {
    id: "mermaid-sequence",
    category: "diagrams",
    title: "Sequence Diagram",
    description: "Actor lifelines, request and response messages",
    template:
      "```mermaid\nsequenceDiagram\n  autonumber\n  User->>Client: Click action\n  Client->>Server: POST /api/data\n  Server-->>Client: 200 OK\n  Client-->>User: Update view\n```\n",
  },
  {
    id: "mermaid-mindmap",
    category: "diagrams",
    title: "Mindmap",
    description: "Branching brainstorming and concept hierarchy",
    template:
      "```mermaid\nmindmap\n  root((Project))\n    Research\n      Users\n      Competitors\n    Design\n      Wireframes\n      Prototypes\n    Development\n      Frontend\n      Backend\n```\n",
  },
  {
    id: "mermaid-class",
    category: "diagrams",
    title: "Class Diagram",
    description: "Object-oriented class relationships and fields",
    template:
      '```mermaid\nclassDiagram\n  class User {\n    +String id\n    +String name\n    +login()\n  }\n  class Profile {\n    +String bio\n    +updateBio()\n  }\n  User "1" --> "1" Profile\n```\n',
  },
  {
    id: "mermaid-state",
    category: "diagrams",
    title: "State Diagram",
    description: "State transitions and event triggers",
    template:
      "```mermaid\nstateDiagram-v2\n  [*] --> Idle\n  Idle --> Processing : Submit\n  Processing --> Success : Done\n  Processing --> Failed : Error\n  Success --> [*]\n  Failed --> Idle : Retry\n```\n",
  },
  {
    id: "mermaid-er",
    category: "diagrams",
    title: "Entity-Relationship (ER)",
    description: "Database schema entities and relationships",
    template:
      "```mermaid\nerDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains\n  CUSTOMER {\n    string id PK\n    string name\n  }\n```\n",
  },
  {
    id: "mermaid-git",
    category: "diagrams",
    title: "Git Graph",
    description: "Branching and merge timeline",
    template:
      "```mermaid\ngitGraph\n  commit\n  branch feature\n  checkout feature\n  commit\n  checkout main\n  merge feature\n  commit\n```\n",
  },
  {
    id: "mermaid-pie",
    category: "diagrams",
    title: "Pie Chart",
    description: "Proportional categorical breakdown",
    template:
      '```mermaid\npie title Project Allocation\n  "Engineering" : 50\n  "Design" : 30\n  "Research" : 20\n```\n',
  },

  // --- Tables ---
  {
    id: "table-3x3",
    category: "tables",
    title: "3x3 Table",
    description: "Standard markdown table with 3 columns and rows",
    template:
      "| Header 1 | Header 2 | Header 3 |\n| :--- | :--- | :--- |\n| Row 1 | Data | Value |\n| Row 2 | Data | Value |\n| Row 3 | Data | Value |\n\n",
  },
  {
    id: "table-database",
    category: "tables",
    title: "Database / Task Table",
    description: "Task tracking table with Status, Owner, and Priority",
    template:
      "| Task | Owner | Status | Priority |\n| :--- | :--- | :--- | :--- |\n| Feature 1 | @name | In Progress | High |\n| Bug fix | @name | Done | Medium |\n\n",
  },
  {
    id: "table-comparison",
    category: "tables",
    title: "Comparison Table",
    description: "Feature matrix comparing Options A & B",
    template:
      "| Feature | Option A | Option B |\n| :--- | :---: | :---: |\n| Speed | Yes | No |\n| Offline | Yes | Yes |\n\n",
  },

  // --- Callouts ---
  {
    id: "callout-note",
    category: "callouts",
    title: "Note Callout",
    description: "Standard informative callout block",
    template: "> [!NOTE]\n> Enter context or helpful information here.\n\n",
  },
  {
    id: "callout-tip",
    category: "callouts",
    title: "Tip Callout",
    description: "Helpful tip, shortcut, or best practice",
    template: "> [!TIP]\n> Pro-tip or performance suggestion.\n\n",
  },
  {
    id: "callout-warning",
    category: "callouts",
    title: "Warning Callout",
    description: "Cautionary note or critical caveat",
    template:
      "> [!WARNING]\n> Warning: please double-check before proceeding.\n\n",
  },
  {
    id: "callout-quote",
    category: "callouts",
    title: "Quote Block",
    description: "Blockquote with author citation",
    template:
      '> "Simplicity is prerequisite for reliability."\n> — Edsger W. Dijkstra\n\n',
  },

  // --- Media & Math ---
  {
    id: "math-block",
    category: "media",
    title: "Math Formula Block",
    description: "Display math equations using KaTeX",
    template: "$$\n\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)\n$$\n\n",
  },
  {
    id: "math-inline",
    category: "media",
    title: "Inline Math",
    description: "Inline LaTeX equation",
    template: "$E = mc^2$",
  },

  // --- Code Blocks ---
  {
    id: "code-ts",
    category: "code",
    title: "TypeScript / JS",
    description: "Syntax highlighted TypeScript code block",
    template:
      '```typescript\nfunction example(): void {\n  console.log("Hello world");\n}\n```\n\n',
  },
  {
    id: "code-rust",
    category: "code",
    title: "Rust",
    description: "Syntax highlighted Rust code block",
    template:
      '```rust\nfn main() {\n    println!("Hello, world!");\n}\n```\n\n',
  },
  {
    id: "code-python",
    category: "code",
    title: "Python",
    description: "Syntax highlighted Python code block",
    template: '```python\ndef main():\n    print("Hello world")\n```\n\n',
  },
  {
    id: "code-sql",
    category: "code",
    title: "SQL Query",
    description: "Syntax highlighted SQL code block",
    template:
      "```sql\nSELECT id, name, created_at\nFROM notes\nORDER BY created_at DESC;\n```\n\n",
  },
];
