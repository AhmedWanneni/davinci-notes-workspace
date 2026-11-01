import type { Meta, StoryObj } from "@storybook/react";
import { AgentCodeBlock } from "./AgentCodeBlock";

const meta: Meta<typeof AgentCodeBlock> = {
  title: "AgentView/AgentCodeBlock",
  component: AgentCodeBlock,
};

export default meta;
type Story = StoryObj<typeof AgentCodeBlock>;

export const Typescript: Story = {
  args: {
    code: "function greeting(name: string): string {\n  return `Hello ${name}!`;\n}",
    lang: "typescript",
    onSaveAsNote: (code) => console.log("save note", code),
  },
};
