import type { Meta, StoryObj } from "@storybook/react";
import { TodoScheduledRow } from "./TodoScheduledRow";

const meta: Meta<typeof TodoScheduledRow> = {
  title: "Todos/TodoScheduledRow",
  component: TodoScheduledRow,
  args: {
    item: {
      id: "msg-1",
      channelId: "default",
      channelKind: "telegram",
      recipientLabel: "@john_doe",
      messageText: "Sprint retrospective tomorrow at 10 AM",
      dueAtUtc: new Date(Date.now() + 86400000).toISOString(),
      tz: "UTC",
      localDate: "2026-11-04",
      localTime: "10:00",
      recurrenceRule: "weekly",
      allowMentions: false,
      status: "scheduled",
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSentAt: null,
      lastError: null,
    },
    onSendNow: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodoScheduledRow>;

export const Scheduled: Story = {};

export const NeedsManualSend: Story = {
  args: {
    item: {
      id: "msg-2",
      channelId: "default",
      channelKind: "whatsapp-click",
      recipientLabel: "+1234567890",
      messageText: "Hello, following up on our project proposal.",
      dueAtUtc: new Date().toISOString(),
      tz: "UTC",
      localDate: "2026-11-03",
      localTime: "14:00",
      recurrenceRule: null,
      allowMentions: false,
      status: "needs_manual_send",
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSentAt: null,
      lastError: null,
    },
  },
};

export const Sent: Story = {
  args: {
    item: {
      id: "msg-3",
      channelId: "default",
      channelKind: "slack",
      recipientLabel: "#general",
      messageText: "Build deployment finished successfully.",
      dueAtUtc: new Date(Date.now() - 3600000).toISOString(),
      tz: "UTC",
      localDate: "2026-11-03",
      localTime: "11:00",
      recurrenceRule: null,
      allowMentions: false,
      status: "sent",
      attempts: 1,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 3600000,
      lastSentAt: Date.now() - 3600000,
      lastError: null,
    },
  },
};
