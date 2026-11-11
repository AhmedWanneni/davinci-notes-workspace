import type { Meta, StoryObj } from "@storybook/react";
import { AgentProjectView } from "./AgentProjectView";

const meta: Meta<typeof AgentProjectView> = {
  title: "Components/AgentProjectView",
  component: AgentProjectView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentProjectView>;

export const Default: Story = {
  args: {
    projectId: "proj-gym",
    onSend: (p: string) => console.log("Send:", p),
  },
};
