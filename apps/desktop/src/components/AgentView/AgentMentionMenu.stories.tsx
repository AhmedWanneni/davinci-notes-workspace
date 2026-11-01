import type { Meta, StoryObj } from "@storybook/react";
import { AgentMentionMenu } from "./AgentMentionMenu";

const meta: Meta<typeof AgentMentionMenu> = {
  title: "AgentView/AgentMentionMenu",
  component: AgentMentionMenu,
};

export default meta;
type Story = StoryObj<typeof AgentMentionMenu>;

export const Default: Story = {
  args: {
    isOpen: true,
    query: "work",
    selectedIndex: 0,
    onSelect: (item) => console.log("Selected:", item),
    onClose: () => console.log("Closed"),
  },
};
