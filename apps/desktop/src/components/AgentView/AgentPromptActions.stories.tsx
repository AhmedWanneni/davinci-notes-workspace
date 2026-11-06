import type { Meta, StoryObj } from "@storybook/react";
import { AgentPromptActions } from "./AgentPromptActions";

const meta: Meta<typeof AgentPromptActions> = {
  title: "Components/AgentPromptActions",
  component: AgentPromptActions,
};

export default meta;
type Story = StoryObj<typeof AgentPromptActions>;

export const Idle: Story = {
  args: {
    isStreaming: false,
    onCancel: () => {},
    onSend: () => {},
  },
};

export const ReadyToSend: Story = {
  args: {
    isStreaming: false,
    onCancel: () => {},
    onSend: () => {},
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
    onCancel: () => {},
    onSend: () => {},
  },
};
