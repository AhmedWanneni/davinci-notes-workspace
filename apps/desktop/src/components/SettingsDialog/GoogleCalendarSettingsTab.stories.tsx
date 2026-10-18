import type { Meta, StoryObj } from "@storybook/react-vite";
import { GoogleCalendarSettingsTab } from "./GoogleCalendarSettingsTab";

const meta = {
  title: "Components/SettingsDialog/GoogleCalendarSettingsTab",
  component: GoogleCalendarSettingsTab,
} satisfies Meta<typeof GoogleCalendarSettingsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
