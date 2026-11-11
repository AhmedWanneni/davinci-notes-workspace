// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoScheduledRow } from "./TodoScheduledRow";
import type { ScheduledMessageRecord } from "../../reminders/scheduledMessagesStore";

const sampleScheduled: ScheduledMessageRecord = {
  id: "msg-123",
  channelId: "default",
  channelKind: "telegram",
  recipientLabel: "@john_doe",
  messageText: "Sprint retrospective tomorrow at 10 AM",
  dueAtUtc: "2026-11-04T10:00:00Z",
  tz: "UTC",
  localDate: "2026-11-04",
  localTime: "10:00",
  recurrenceRule: "weekly",
  allowMentions: false,
  status: "scheduled",
  attempts: 0,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  lastSentAt: null,
  lastError: null,
};

describe("TodoScheduledRow", () => {
  it("renders scheduled message recipient, text, status, and repeat rule", () => {
    render(
      <TodoScheduledRow
        item={sampleScheduled}
        onSendNow={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("@john_doe")).toBeDefined();
    expect(screen.getByText("Sprint retrospective tomorrow at 10 AM")).toBeDefined();
    expect(screen.getByText("Scheduled")).toBeDefined();
    expect(screen.getByText("weekly")).toBeDefined();
  });

  it("triggers onSendNow when clicking Send Now", () => {
    const onSendNow = vi.fn();
    render(
      <TodoScheduledRow
        item={sampleScheduled}
        onSendNow={onSendNow}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Send immediately"));
    expect(onSendNow).toHaveBeenCalledWith(sampleScheduled);
  });

  it("triggers onCancel when clicking Cancel button", () => {
    const onCancel = vi.fn();
    render(
      <TodoScheduledRow
        item={sampleScheduled}
        onSendNow={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTitle("Cancel scheduled message"));
    expect(onCancel).toHaveBeenCalledWith("msg-123");
  });
});
