import type { Meta, StoryObj } from "@storybook/react";
import { AgentProjectInstructionsSection } from "./AgentProjectInstructionsSection";

const meta: Meta<typeof AgentProjectInstructionsSection> = {
  title: "AgentView/AgentProjectInstructionsSection",
  component: AgentProjectInstructionsSection,
};

export default meta;
type Story = StoryObj<typeof AgentProjectInstructionsSection>;

export const Default: Story = {
  args: {
    projectId: "proj_sample",
  },
};
