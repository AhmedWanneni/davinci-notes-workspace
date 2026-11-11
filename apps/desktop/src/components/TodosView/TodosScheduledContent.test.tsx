// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodosScheduledContent } from "./TodosScheduledContent";
import type { ScheduledMessageRecord } from "../../reminders/scheduledMessagesStore";

const sampleItems: ScheduledMessageRecord[] = [
  {
    id: "msg-1",
    channelId: "default",
    channelKind: "slack",
    recipientLabel: "#general",
    messageText: "Weekly team announcement",
    dueAtUtc: "2026-11-05T09:00:00Z",
    tz: "UTC",
    localDate: "2026-11-05",
    localTime: "09:00",
    recurrenceRule: null,
    allowMentions: false,
    status: "scheduled",
    attempts: 0,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastSentAt: null,
    lastError: null,
  },
  {
    id: "msg-2",
    channelId: "default",
    channelKind: "whatsapp-click",
    recipientLabel: "+1234567890",
    messageText: "WhatsApp client reminder",
    dueAtUtc: "2026-11-05T11:00:00Z",
    tz: "UTC",
    localDate: "2026-11-05",
    localTime: "11:00",
    recurrenceRule: null,
    allowMentions: false,
    status: "needs_manual_send",
    attempts: 0,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastSentAt: null,
    lastError: null,
  },
];

describe("TodosScheduledContent", () => {
  it("renders scheduled messages sections and items", () => {
    render(
      <TodosScheduledContent
        items={sampleItems}
        searchQuery=""
        filter="all"
        onSendNow={vi.fn()}
        onCancel={vi.fn()}
        onNewMessage={vi.fn()}
      />,
    );

    expect(screen.getByText("Pending / Scheduled")).toBeDefined();
    expect(screen.getByText("Weekly team announcement")).toBeDefined();
    expect(screen.getByText("Needs Manual Send")).toBeDefined();
    expect(screen.getByText("WhatsApp client reminder")).toBeDefined();
  });

  it("calls onNewMessage when clicking Schedule Message button", () => {
    const onNewMessage = vi.fn();
    render(
      <TodosScheduledContent
        items={sampleItems}
        searchQuery=""
        filter="all"
        onSendNow={vi.fn()}
        onCancel={vi.fn()}
        onNewMessage={onNewMessage}
      />,
    );

    const addBtn = screen.getByRole("button", { name: "Schedule Message" });
    fireEvent.click(addBtn);
    expect(onNewMessage).toHaveBeenCalled();
  });
});
