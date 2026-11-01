import type { Meta, StoryObj } from "@storybook/react";
import { AgentMermaidBlock } from "./AgentMermaidBlock";

const meta: Meta<typeof AgentMermaidBlock> = {
  title: "AgentView/AgentMermaidBlock",
  component: AgentMermaidBlock,
};

export default meta;
type Story = StoryObj<typeof AgentMermaidBlock>;

export const Flowchart: Story = {
  args: {
    source:
      "graph TD\n  Start --> Decision{Is valid?}\n  Decision -- Yes --> OK\n  Decision -- No --> Error",
    onSaveAsNote: (src) => console.log("save note", src),
  },
};
