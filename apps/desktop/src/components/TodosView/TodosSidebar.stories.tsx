import type { Meta, StoryObj } from "@storybook/react";
import { TooltipProvider } from "@app/design-system";
import { TodosSidebar } from "./TodosSidebar";

const meta: Meta<typeof TodosSidebar> = {
  title: "Todos/TodosSidebar",
  component: TodosSidebar,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div style={{ height: 600, display: "flex" }}>
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  args: {
    projects: [
      {
        id: "todos/Design",
        name: "Design",
        folderPath: "todos/Design",
        notePath: "todos/Design/Admin Dashboard.md",
        notes: [
          {
            id: "todos/Design/Admin Dashboard.md",
            name: "Admin Dashboard",
            notePath: "todos/Design/Admin Dashboard.md",
            sections: [],
          },
        ],
        sections: [],
      },
      {
        id: "todos/Engineering",
        name: "Engineering",
        folderPath: "todos/Engineering",
        notePath: "todos/Engineering/Sprint.md",
        notes: [
          {
            id: "todos/Engineering/Sprint.md",
            name: "Sprint",
            notePath: "todos/Engineering/Sprint.md",
            sections: [],
          },
        ],
        sections: [],
      },
    ],
    selectedProjectId: "todos/Design",
    selectedNotePath: "todos/Design/Admin Dashboard.md",
    viewMode: "project",
    totalTodosCount: 14,
    remindersCount: 3,
    overdueCount: 1,
    scheduledCount: 2,
    onSelectProject: () => {},
    onSelectNote: () => {},
    onSelectMotherboard: () => {},
    onSelectReminders: () => {},
    onSelectScheduled: () => {},
    onCreateProject: () => {},
    onToggleSidebar: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodosSidebar>;

export const Default: Story = {};
