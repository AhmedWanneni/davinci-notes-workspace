import type { Meta, StoryObj } from "@storybook/react";
import { NotificationsSettingsTab } from "./NotificationsSettingsTab";

const meta: Meta<typeof NotificationsSettingsTab> = {
  title: "Settings/NotificationsSettingsTab",
  component: NotificationsSettingsTab,
};

export default meta;
type Story = StoryObj<typeof NotificationsSettingsTab>;

export const Default: Story = {};
