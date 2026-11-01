import type { Meta, StoryObj } from "@storybook/react";
import { AgentPromptModelPicker } from "./AgentPromptModelPicker";

const meta: Meta<typeof AgentPromptModelPicker> = {
  title: "Components/AgentPromptModelPicker",
  component: AgentPromptModelPicker,
};

export default meta;
type Story = StoryObj<typeof AgentPromptModelPicker>;

export const Default: Story = {};
