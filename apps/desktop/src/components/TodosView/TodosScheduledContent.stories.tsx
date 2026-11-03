import type { Meta, StoryObj } from "@storybook/react";
import { TodosScheduledContent } from "./TodosScheduledContent";

const meta: Meta<typeof TodosScheduledContent> = {
  title: "Todos/TodosScheduledContent",
  component: TodosScheduledContent,
  args: {
    items: [
      {
        id: "msg-1",
        channelId: "default",
        channelKind: "telegram",
        recipientLabel: "@john",
        messageText: "Sprint retro tomorrow at 10 AM",
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
      {
        id: "msg-2",
        channelId: "default",
        channelKind: "whatsapp-click",
        recipientLabel: "+1234567890",
        messageText: "Friendly follow-up reminder",
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
    ],
    searchQuery: "",
    filter: "all",
    onSendNow: () => {},
    onCancel: () => {},
    onNewMessage: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TodosScheduledContent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
