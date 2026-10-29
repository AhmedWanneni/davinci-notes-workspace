// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventModal } from "./EventModal";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

const sampleEvent: NormalizedCalendarEvent = {
  id: "evt_1",
  calendarId: "primary",
  title: "Sprint Review",
  description: "Demo new features",
  location: "Room 3B",
  startIso: "2026-04-16T10:00:00.000Z",
  endIso: "2026-04-16T11:00:00.000Z",
  isAllDay: false,
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=1",
  meetUrl: "https://meet.google.com/abc-defg-hij",
  attendees: [],
  organizerEmail: "alice@example.com",
  etag: '"etag_1"',
  syncStatus: "synced",
  recurringEventId: "series_1",
  updatedAt: "2026-04-16T08:00:00.000Z",
};

describe("EventModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <EventModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("submits a new timed event with local timeZone", () => {
    const onSave = vi.fn();
    render(
      <EventModal
        isOpen={true}
        initialDate="2026-04-16"
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByTestId("event-title-input"), {
      target: { value: "Architecture Sync" },
    });
    fireEvent.click(screen.getByTestId("event-save-btn"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [calId, payload] = onSave.mock.calls[0];
    expect(calId).toBe("daily");
    expect(payload.summary).toBe("Architecture Sync");
    expect(payload.start.dateTime).toBeDefined();
    expect(payload.start.timeZone).toBeDefined();
  });

  it("submits an all-day event with exclusive end date (+1 day)", () => {
    const onSave = vi.fn();
    render(
      <EventModal
        isOpen={true}
        initialDate="2026-04-20"
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByTestId("event-title-input"), {
      target: { value: "Company Offsite" },
    });
    fireEvent.click(screen.getByTestId("event-all-day-checkbox"));
    fireEvent.click(screen.getByTestId("event-save-btn"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [, payload] = onSave.mock.calls[0];
    expect(payload.start).toEqual({ date: "2026-04-20" });
    expect(payload.end).toEqual({ date: "2026-04-21" });
  });

  it("displays recurrence notice and delete button when editing a recurring event", () => {
    const onDelete = vi.fn();
    render(
      <EventModal
        isOpen={true}
        event={sampleEvent}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByTestId("event-recurrence-notice")).toBeDefined();
    fireEvent.click(screen.getByTestId("event-delete-btn"));
    expect(onDelete).toHaveBeenCalledWith(sampleEvent);
  });

  it("allows promoting a Vault Reminder into a Calendar Event", () => {
    const onSave = vi.fn();
    const reminderEvent: NormalizedCalendarEvent = {
      ...sampleEvent,
      id: "reminder_42",
      calendarId: "vault_reminders",
      title: "🔔 Review PR",
      recurringEventId: undefined,
    };

    render(
      <EventModal
        isOpen={true}
        event={reminderEvent}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const promoteBtn = screen.getByTestId("event-promote-reminder-btn");
    expect(promoteBtn.textContent).toBe("Add as Calendar Event");
    fireEvent.click(promoteBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    const [calId, payload] = onSave.mock.calls[0];
    expect(calId).toBe("daily");
    expect(payload.summary).toBe("Review PR");
  });
});
