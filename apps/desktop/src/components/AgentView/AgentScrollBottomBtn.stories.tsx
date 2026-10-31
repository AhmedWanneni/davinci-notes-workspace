import type { Meta, StoryObj } from "@storybook/react";
import { AgentScrollBottomBtn } from "./AgentScrollBottomBtn";

const meta: Meta<typeof AgentScrollBottomBtn> = {
  title: "AgentView/AgentScrollBottomBtn",
  component: AgentScrollBottomBtn,
};

export default meta;
type Story = StoryObj<typeof AgentScrollBottomBtn>;

export const Visible: Story = {
  args: {
    visible: true,
    onClick: () => console.log("Jump to latest clicked"),
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    onClick: () => console.log("Hidden"),
  },
};
