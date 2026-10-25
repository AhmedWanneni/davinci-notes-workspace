import type { Meta, StoryObj } from "@storybook/react";
import { AgentView } from "./AgentView";

const meta: Meta<typeof AgentView> = {
  title: "Components/AgentView",
  component: AgentView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentView>;

export const Default: Story = {};
