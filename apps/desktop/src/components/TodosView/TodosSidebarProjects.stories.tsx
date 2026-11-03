import type { Meta, StoryObj } from "@storybook/react";
import { TodosSidebarProjects } from "./TodosSidebarProjects";

const meta: Meta<typeof TodosSidebarProjects> = {
  title: "Todos/TodosSidebarProjects",
  component: TodosSidebarProjects,
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
    ],
    selectedProjectId: "todos/Design",
    viewMode: "project",
    onSelectProject: () => {},
    onCreateProject: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodosSidebarProjects>;

export const Default: Story = {};
