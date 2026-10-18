import { describe, expect, it, vi } from "vitest";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import {
  getUpcomingMeetingAlerts,
  formatUpcomingMeetingsForTray,
  startMeetingReminderScheduler,
} from "./calendarReminderBridge";

const baseNow = new Date("2026-10-20T10:00:00.000Z");

function createEvent(
  id: string,
  startIso: string,
  endIso: string,
  title: string = "Test Meeting",
  meetUrl?: string,
): NormalizedCalendarEvent {
  return {
    id,
    calendarId: "primary",
    title,
    startIso,
    endIso,
    isAllDay: false,
    meetUrl,
    location: "Online",
    status: "confirmed",
    attendees: [],
    updatedAt: Date.now(),
  };
}

describe("calendarReminderBridge", () => {
  it("detects events starting in 4 minutes as 5min heads-up stage", () => {
    const in4Min = new Date(baseNow.getTime() + 4 * 60 * 1000).toISOString();
    const end = new Date(baseNow.getTime() + 34 * 60 * 1000).toISOString();
    const event = createEvent("evt-1", in4Min, end, "Sprint Retro");

    const alerts = getUpcomingMeetingAlerts([event], baseNow);
    expect(alerts.length).toBe(1);
    expect(alerts[0].stage).toBe("5min");
    expect(alerts[0].startsInMinutes).toBe(4);
    expect(alerts[0].event.title).toBe("Sprint Retro");
  });

  it("detects events starting right now as now stage", () => {
    const started1MinAgo = new Date(
      baseNow.getTime() - 1 * 60 * 1000,
    ).toISOString();
    const end = new Date(baseNow.getTime() + 29 * 60 * 1000).toISOString();
    const event = createEvent("evt-now", started1MinAgo, end, "Standup");

    const alerts = getUpcomingMeetingAlerts([event], baseNow);
    expect(alerts.length).toBe(1);
    expect(alerts[0].stage).toBe("now");
    expect(alerts[0].startsInMinutes).toBe(0);
  });

  it("skips cancelled events and far future meetings", () => {
    const farFuture = new Date(
      baseNow.getTime() + 60 * 60 * 1000,
    ).toISOString();
    const event1 = createEvent("evt-far", farFuture, farFuture);
    const event2 = {
      ...createEvent(
        "evt-canc",
        new Date(baseNow.getTime() + 3 * 60 * 1000).toISOString(),
        farFuture,
      ),
      status: "cancelled" as const,
    };

    const alerts = getUpcomingMeetingAlerts([event1, event2], baseNow);
    expect(alerts.length).toBe(0);
  });

  it("prevents duplicate alerts using notifiedKeys set", () => {
    const in3Min = new Date(baseNow.getTime() + 3 * 60 * 1000).toISOString();
    const event = createEvent("evt-dup", in3Min, in3Min);
    const notified = new Set<string>();

    const alerts1 = getUpcomingMeetingAlerts([event], baseNow, notified);
    expect(alerts1.length).toBe(1);

    const alerts2 = getUpcomingMeetingAlerts([event], baseNow, notified);
    expect(alerts2.length).toBe(0);
  });

  it("formats upcoming meetings for system tray", () => {
    const e1 = createEvent(
      "e1",
      new Date(baseNow.getTime() + 30 * 60 * 1000).toISOString(),
      "",
      "Review",
      "https://meet.google.com/xyz",
    );
    const e2 = createEvent(
      "e2",
      new Date(baseNow.getTime() + 10 * 60 * 1000).toISOString(),
      "",
      "1:1",
    );

    const trayItems = formatUpcomingMeetingsForTray([e1, e2], baseNow);
    expect(trayItems.length).toBe(2);
    // Earliest first
    expect(trayItems[0].text).toContain("📅 1:1");
    expect(trayItems[1].text).toContain("📹 Review");
    expect(trayItems[1].notePath).toBe("https://meet.google.com/xyz");
  });

  it("runs scheduler and dispatches alerts", async () => {
    const in2Min = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const event = createEvent("evt-sched", in2Min, in2Min, "Live Alert Test");
    const getEvents = vi.fn().mockResolvedValue([event]);
    const onAlert = vi.fn();

    const stop = startMeetingReminderScheduler(getEvents, onAlert, 100000);
    await vi.waitFor(() => {
      expect(onAlert).toHaveBeenCalled();
    });

    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "5min",
      }),
    );

    stop();
  });
});
