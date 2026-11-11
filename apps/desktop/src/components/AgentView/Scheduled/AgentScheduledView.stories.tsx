import type { Meta, StoryObj } from "@storybook/react";
import { AgentScheduledView } from "./AgentScheduledView";
import { useScheduleStore } from "./useScheduleStore";
import { toUtcRecurrence } from "./scheduleTime";

const meta: Meta<typeof AgentScheduledView> = {
  title: "Components/AgentScheduledView",
  component: AgentScheduledView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentScheduledView>;

const tomorrow8am = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
};

export const Empty: Story = {
  beforeEach: () => {
    useScheduleStore.setState({ schedules: [], isLoaded: true, lastCreatedId: null });
  },
};

export const WithTasks: Story = {
  beforeEach: () => {
    useScheduleStore.setState({
      isLoaded: true,
      lastCreatedId: "s1",
      schedules: [
        {
          id: "s1",
          emoji: "👗",
          title: "Daily Outfit Suggestion",
          prompt: "Every morning, suggest an easy outfit…",
          recurrence: toUtcRecurrence({ frequency: "daily", time: "08:00", dayOfWeek: 1, intervalHours: 24 }),
          enabled: true,
          nextRunUtc: tomorrow8am(),
        },
        {
          id: "s2",
          emoji: "🎬",
          title: "What to watch",
          prompt: "Pick three movies…",
          recurrence: toUtcRecurrence({ frequency: "weekly", time: "19:00", dayOfWeek: 5, intervalHours: 24 }),
          enabled: false,
          nextRunUtc: tomorrow8am(),
        },
      ],
    });
  },
};
