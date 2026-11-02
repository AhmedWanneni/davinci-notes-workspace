import type { Meta, StoryObj } from "@storybook/react";
import { AIListeningSettingsTab } from "./AIListeningSettingsTab";

const meta: Meta<typeof AIListeningSettingsTab> = {
  title: "Settings/AIListeningSettingsTab",
  component: AIListeningSettingsTab,
};

export default meta;
type Story = StoryObj<typeof AIListeningSettingsTab>;

export const Default: Story = {};
