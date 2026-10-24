import type { Meta, StoryObj } from "@storybook/react";
import { KanbanView } from "./KanbanView";

const sampleMarkdown = `---
kanban-plugin: board
---

## Backlog
- [ ] Research competitor feature parity
- [ ] Architecture design for sync engine

## In Progress
- [ ] Implement Kanban board view
\tCard with multi-line notes and [[Backlinks]]
- [ ] SCSS token styling

## Done
- [x] Initial setup and project scaffolding
`;

const meta = {
  title: "Kanban/KanbanView",
  component: KanbanView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof KanbanView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    path: "board.md",
    initialContent: sampleMarkdown,
    onContentChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    path: "empty-board.md",
    initialContent: "---\nkanban-plugin: board\n---\n",
    onContentChange: () => {},
  },
};
