import type { Meta, StoryObj } from "@storybook/react";
import { AgentCliSection } from "./AgentCliSection";

const meta: Meta<typeof AgentCliSection> = {
  title: "AgentView/AgentCliSection",
  component: AgentCliSection,
};

export default meta;
type Story = StoryObj<typeof AgentCliSection>;

export const Default: Story = {
  args: {
    selectedCliAgent: "agy",
    onSelectCliAgent: (id) => console.log("Selected CLI agent:", id),
  },
};
