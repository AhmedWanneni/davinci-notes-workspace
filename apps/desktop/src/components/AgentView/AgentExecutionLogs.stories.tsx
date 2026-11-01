import type { Meta, StoryObj } from "@storybook/react";
import { AgentExecutionLogs } from "./AgentExecutionLogs";

const meta: Meta<typeof AgentExecutionLogs> = {
  title: "Components/AgentExecutionLogs",
  component: AgentExecutionLogs,
};

export default meta;
type Story = StoryObj<typeof AgentExecutionLogs>;

export const Default: Story = {
  args: {
    logs: [
      "Analyzing user request and available context...",
      "Reading note 'Project Overview.md'...",
      "Executing tool find_related_notes...",
      "Synthesizing markdown answer...",
    ],
    isStreaming: false,
    defaultOpen: true,
  },
};

export const Streaming: Story = {
  args: {
    logs: [
      "Starting CLI Agent: Claude Code...",
      "Inspecting repository structure...",
      "Thinking...",
    ],
    isStreaming: true,
  },
};
