import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarPreferencesCard } from "./CalendarPreferencesCard";

const meta = {
  title: "Components/SettingsDialog/CalendarPreferencesCard",
  component: CalendarPreferencesCard,
} satisfies Meta<typeof CalendarPreferencesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    refreshInterval: "15m",
    meetingsFolder: "Meetings",
    showDeclined: false,
    onIntervalChange: () => {},
    onMeetingsFolderChange: () => {},
    onToggleDeclined: () => {},
  },
};
