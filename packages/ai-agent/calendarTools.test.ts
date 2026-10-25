import { describe, expect, it, vi } from "vitest";
import {
  CALENDAR_CREATE_EVENT_TOOL,
  CALENDAR_LIST_EVENTS_TOOL,
  CALENDAR_SYNC_TASKS_TOOL,
  executeCalendarCreateEvent,
  executeCalendarListEvents,
  executeCalendarSyncTasks,
  extractTaskReminders,
  type AgentCalendarBackend,
} from "./calendarTools.js";

describe("calendarTools", () => {
  it("declares tool definitions with expected schemas", () => {
    expect(CALENDAR_LIST_EVENTS_TOOL.name).toBe("calendar_list_events");
    expect(CALENDAR_CREATE_EVENT_TOOL.name).toBe("calendar_create_event");
    expect(CALENDAR_SYNC_TASKS_TOOL.name).toBe("calendar_sync_tasks");
  });

  it("extracts task reminders from note markdown checklists", () => {
    const md = `
# Tasks
- [ ] Review PR for Agent feature (@2026-10-26 14:00)
- [x] Finished task (@2026-10-25 09:30)
- [ ] Task with day only (@2026-10-27)
- [ ] Task without date
- Regular bullet item
    `;

    const extracted = extractTaskReminders(md);
    expect(extracted).toHaveLength(3);
    expect(extracted[0].text).toBe("Review PR for Agent feature");
    expect(extracted[0].startIso).toBe("2026-10-26T14:00:00.000Z");
    expect(extracted[0].endIso).toBe("2026-10-26T15:00:00.000Z");

    expect(extracted[1].text).toBe("Finished task");
    expect(extracted[2].text).toBe("Task with day only");
    expect(extracted[2].startIso).toBe("2026-10-27T09:00:00.000Z");
  });

  it("executes calendar list events", async () => {
    const mockBackend: AgentCalendarBackend = {
      listEvents: vi.fn().mockResolvedValue([
        {
          id: "evt-1",
          calendarId: "primary",
          title: "Sprint Standup",
          startIso: "2026-10-26T09:00:00Z",
          endIso: "2026-10-26T09:30:00Z",
          isAllDay: false,
          status: "confirmed",
          attendees: [],
          updatedAt: Date.now(),
        },
      ]),
      createEvent: vi.fn(),
    };

    const res = await executeCalendarListEvents(
      { timeMin: "2026-10-26T00:00:00Z" },
      mockBackend,
    );
    expect(res.events).toHaveLength(1);
    expect(res.events[0].title).toBe("Sprint Standup");
    expect(mockBackend.listEvents).toHaveBeenCalledWith(
      "2026-10-26T00:00:00Z",
      undefined,
      "primary",
    );
  });

  it("executes calendar create event with validation", async () => {
    const mockBackend: AgentCalendarBackend = {
      listEvents: vi.fn(),
      createEvent: vi.fn().mockResolvedValue({
        id: "new-evt",
        calendarId: "primary",
        title: "Focus Block",
        startIso: "2026-10-26T10:00:00Z",
        endIso: "2026-10-26T12:00:00Z",
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: Date.now(),
      }),
    };

    await expect(
      executeCalendarCreateEvent({ summary: "" }, mockBackend),
    ).rejects.toThrow("calendar_create_event: summary is required");

    const created = await executeCalendarCreateEvent(
      {
        summary: "Focus Block",
        startIso: "2026-10-26T10:00:00Z",
        endIso: "2026-10-26T12:00:00Z",
      },
      mockBackend,
    );

    expect(created.id).toBe("new-evt");
    expect(mockBackend.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: "Focus Block",
        startIso: "2026-10-26T10:00:00Z",
        endIso: "2026-10-26T12:00:00Z",
      }),
    );
  });

  it("executes calendar sync tasks to schedule reminders as calendar events", async () => {
    const mockBackend: AgentCalendarBackend = {
      listEvents: vi.fn(),
      createEvent: vi.fn().mockImplementation(async (input) => ({
        id: `gen-${Math.random()}`,
        calendarId: "primary",
        title: input.summary,
        startIso: input.startIso,
        endIso: input.endIso,
        isAllDay: false,
        status: "confirmed",
        attendees: [],
        updatedAt: Date.now(),
      })),
    };

    const content = `
## Action Items
- [ ] Finish slide deck (@2026-10-27 16:00)
- [ ] Submit quarterly report (@2026-10-28 11:00)
    `;

    const res = await executeCalendarSyncTasks({ noteContent: content }, mockBackend);
    expect(res.createdCount).toBe(2);
    expect(res.events[0].title).toBe("Finish slide deck");
    expect(res.events[1].title).toBe("Submit quarterly report");
    expect(mockBackend.createEvent).toHaveBeenCalledTimes(2);
  });
});
