import type { Meta, StoryObj } from "@storybook/react";
import { TodosProjectContent } from "./TodosProjectContent";

const meta: Meta<typeof TodosProjectContent> = {
  title: "Todos/TodosProjectContent",
  component: TodosProjectContent,
  args: {
    activeProject: {
      id: "todos/Design",
      name: "Design",
      folderPath: "todos/Design",
      notePath: "todos/Design/Admin Dashboard.md",
      notes: [],
      sections: [],
    },
    filteredSections: [
      {
        name: "Backlog",
        todos: [
          {
            id: "t-1",
            text: "Design onboarding cards",
            completed: false,
            notePath: "todos/Design/Admin Dashboard.md",
            lineIndex: 2,
            section: "Backlog",
          },
        ],
      },
    ],
    searchQuery: "",
    allNotePaths: ["todos/Design/Admin Dashboard.md"],
    currentNotePath: "todos/Design/Admin Dashboard.md",
    onToggleTodo: () => {},
    onUpdateText: () => {},
    onAddLink: () => {},
    onAddReminder: () => {},
    onEnterFocus: () => {},
    onAddTodoToSection: async () => {},
    onCreateTodoNote: async () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodosProjectContent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    filteredSections: [],
  },
};
