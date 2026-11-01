import type { Meta, StoryObj } from "@storybook/react";
import { TodosView } from "./TodosView";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SAMPLE_ADMIN_DASHBOARD, SAMPLE_DAILY_ROUTINE } from "./sampleTodos";

const meta: Meta<typeof TodosView> = {
  title: "Views/TodosView",
  component: TodosView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onOpenNote: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodosView>;

export const DefaultDashboard: Story = {
  beforeEach: () => {
    useWorkspaceStore.setState({
      allNotePaths: [
        "todos/Design/Admin Dashboard.md",
        "todos/Design/Marketing Site.md",
        "todos/Design/Native App.md",
        "todos/Routines/Daily Focus.md",
      ],
      notesContent: {
        "todos/Design/Admin Dashboard.md": SAMPLE_ADMIN_DASHBOARD,
        "todos/Design/Marketing Site.md":
          "## Landing Page\n- [ ] Hero copy update\n- [x] CTA button contrast",
        "todos/Design/Native App.md":
          "## Mobile Navigation\n- [ ] Tab bar styling\n- [ ] Deep linking setup",
        "todos/Routines/Daily Focus.md": SAMPLE_DAILY_ROUTINE,
      },
    });
  },
};

export const Empty: Story = {
  beforeEach: () => {
    useWorkspaceStore.setState({
      allNotePaths: [],
      notesContent: {},
    });
  },
};
