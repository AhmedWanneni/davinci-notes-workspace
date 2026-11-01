import type { Meta, StoryObj } from "@storybook/react";
import { AgentTableBlock } from "./AgentTableBlock";

const meta: Meta<typeof AgentTableBlock> = {
  title: "AgentView/AgentTableBlock",
  component: AgentTableBlock,
};

export default meta;
type Story = StoryObj<typeof AgentTableBlock>;

export const Default: Story = {
  args: {
    markdownTable:
      "| Model | Context | Price |\n| --- | --- | --- |\n| Gemini 2.0 Flash | 1M | Free tier |\n| Claude 3.5 Sonnet | 200k | Standard |",
  },
};
