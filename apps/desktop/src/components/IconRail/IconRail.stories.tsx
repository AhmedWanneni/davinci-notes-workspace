import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconRail } from "./IconRail";

const meta = {
  title: "Components/IconRail",
  component: IconRail,
  args: {
    isLeftSidebarOpen: true,
    isGlobalGraphOpen: false,
    onToggleLeftSidebar: () => {},
    onOpenSearch: () => {},
    onOpenGlobalGraph: () => {},
    onOpenSettings: () => {},
    onCloseVault: () => {},
    onDailyNotes: () => {},
    onCreateCanvas: () => {},
    onOpenReminders: () => {},
    onOpenCalendar: () => {},
    onOpenAgent: () => {},
    onOpenAskVault: () => {},
    isCalendarOpen: false,
    isAgentOpen: false,
    isAskVaultOpen: false,
  },
} satisfies Meta<typeof IconRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GraphActive: Story = {
  args: {
    isGlobalGraphOpen: true,
  },
};

export const CalendarActive: Story = {
  args: {
    isCalendarOpen: true,
  },
};

export const SidebarCollapsed: Story = {
  args: {
    isLeftSidebarOpen: false,
  },
};
