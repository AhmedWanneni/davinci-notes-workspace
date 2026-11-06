import type { Meta, StoryObj } from "@storybook/react";
import { ScheduleTaskModal } from "./ScheduleTaskModal";
import { SCHEDULED_RECOMMENDATIONS } from "./scheduledRecommendations";

const outfit = SCHEDULED_RECOMMENDATIONS[1];
const noop = () => {};

const meta: Meta<typeof ScheduleTaskModal> = {
  title: "Components/ScheduleTaskModal",
  component: ScheduleTaskModal,
  args: { isOpen: true, onClose: noop, onSave: noop },
};

export default meta;
type Story = StoryObj<typeof ScheduleTaskModal>;

export const Create: Story = {
  args: {
    mode: "create",
    initialDraft: { title: outfit.title, prompt: outfit.prompt, spec: outfit.spec },
  },
};

export const EditWeekly: Story = {
  args: {
    mode: "edit",
    initialDraft: {
      title: "What to watch",
      prompt: "Pick three movies or shows for me.",
      spec: { frequency: "weekly", time: "19:00", dayOfWeek: 5, intervalHours: 24 },
    },
  },
};

export const Blank: Story = {
  args: {
    initialDraft: {
      title: "",
      prompt: "",
      spec: { frequency: "daily", time: "08:00", dayOfWeek: 1, intervalHours: 24 },
    },
  },
};
