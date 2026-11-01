import type { Meta, StoryObj } from "@storybook/react";
import { AgentWelcomeView } from "./AgentWelcomeView";

const meta: Meta<typeof AgentWelcomeView> = {
  title: "Components/AgentWelcomeView",
  component: AgentWelcomeView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentWelcomeView>;

export const Default: Story = {
  args: {
    userName: "Ahmed",
    onSend: (p: string) => console.log("Send:", p),
  },
};
