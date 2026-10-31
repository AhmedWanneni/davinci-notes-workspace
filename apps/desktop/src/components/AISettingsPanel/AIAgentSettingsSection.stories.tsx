import type { Meta, StoryObj } from "@storybook/react";
import { AIAgentSettingsSection } from "./AIAgentSettingsSection";

const meta: Meta<typeof AIAgentSettingsSection> = {
  title: "AISettingsPanel/AIAgentSettingsSection",
  component: AIAgentSettingsSection,
};

export default meta;
type Story = StoryObj<typeof AIAgentSettingsSection>;

export const Default: Story = {};
