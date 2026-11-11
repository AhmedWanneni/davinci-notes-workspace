import type { Meta, StoryObj } from "@storybook/react";
import { AgentPromptMenu } from "./AgentPromptMenu";

const meta: Meta<typeof AgentPromptMenu> = {
  title: "AgentView/AgentPromptMenu",
  component: AgentPromptMenu,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AgentPromptMenu>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log("onClose"),
    onUploadFiles: () => console.log("onUploadFiles"),
    onTakeScreenshot: () => console.log("onTakeScreenshot"),
    onSelectPrompt: (p) => console.log("onSelectPrompt", p),
  },
};
