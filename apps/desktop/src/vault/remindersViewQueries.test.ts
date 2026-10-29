import { describe, it, expect, vi } from "vitest";
import {
  categorizeReminderDue,
  queryRemindersForView,
  upsertReminderChannelState,
} from "./remindersViewQueries";
import { computeSnoozeTime } from "./reminderSnoozeActions";

describe("reminderSnoozeActions — computeSnoozeTime", () => {
  const baseTime = new Date("2026-10-14T10:00:00.000Z");

  it("computes +10 minutes correctly", () => {
    const target = computeSnoozeTime("10m", baseTime);
    expect(target).toBe("2026-10-14T10:10:00.000Z");
  });

  it("computes +1 hour correctly", () => {
    const target1h = computeSnoozeTime("1h", baseTime);
    expect(target1h).toBe("2026-10-14T11:00:00.000Z");
  });

  it("computes tomorrow morning 9:00 AM local time", () => {
    const target = computeSnoozeTime("tomorrow", baseTime);
    const date = new Date(target);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
    expect(date.getDate()).toBe(baseTime.getDate() + 1);
  });
});

describe("remindersViewQueries — categorizeReminderDue", () => {
  const now = new Date("2026-10-14T15:00:00");

  it("categorizes past time as missed", () => {
    const past = new Date("2026-10-14T14:30:00").toISOString();
    expect(categorizeReminderDue(past, now)).toBe("missed");
  });

  it("categorizes later today as today", () => {
    const laterToday = new Date("2026-10-14T18:00:00").toISOString();
    expect(categorizeReminderDue(laterToday, now)).toBe("today");
  });

  it("categorizes tomorrow and beyond as upcoming", () => {
    const tomorrow = new Date("2026-10-15T09:00:00").toISOString();
    expect(categorizeReminderDue(tomorrow, now)).toBe("upcoming");
  });
});

describe("remindersViewQueries — queryRemindersForView & upsertReminderChannelState", () => {
  it("groups rows into missed, today, upcoming, and done with channel metadata", async () => {
    const mockDb = {
      select: async () => [
        {
          id: 1,
          note_path: "NoteA.md",
          line: 2,
          due_at_utc: "2026-10-14T08:00:00Z",
          tz: "UTC",
          text: "Overdue task",
          done: 0,
          local_key: "key-1",
          status: "missed",
          snooze_until_utc: null,
          channels_json: JSON.stringify(["desktop-default", "slack-team"]),
          delivery_error: "Slack HTTP 503",
        },
        {
          id: 2,
          note_path: "NoteB.md",
          line: 5,
          due_at_utc: "2026-10-14T18:00:00Z",
          tz: "UTC",
          text: "Today task",
          done: 0,
          local_key: null,
          status: null,
          snooze_until_utc: null,
          channels_json: null,
          delivery_error: null,
        },
        {
          id: 3,
          note_path: "NoteC.md",
          line: 1,
          due_at_utc: "2026-10-20T09:00:00Z",
          tz: "UTC",
          text: "Future task",
          done: 0,
          local_key: null,
          status: null,
          snooze_until_utc: null,
          channels_json: null,
          delivery_error: null,
        },
        {
          id: 4,
          note_path: "NoteD.md",
          line: 9,
          due_at_utc: "2026-10-10T09:00:00Z",
          tz: "UTC",
          text: "Completed task",
          done: 1,
          local_key: "key-4",
          status: "notified",
          snooze_until_utc: null,
          channels_json: null,
          delivery_error: null,
        },
      ],
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as Parameters<typeof queryRemindersForView>[0];

    const now = new Date("2026-10-14T12:00:00Z");
    const result = await queryRemindersForView(mockDb, now);

    expect(result.missed).toHaveLength(1);
    expect(result.missed[0].text).toBe("Overdue task");
    expect(result.missed[0].channels).toEqual(["desktop-default", "slack-team"]);
    expect(result.missed[0].deliveryError).toBe("Slack HTTP 503");

    expect(result.today).toHaveLength(1);
    expect(result.today[0].text).toBe("Today task");
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].text).toBe("Future task");
    expect(result.done).toHaveLength(1);
    expect(result.done[0].text).toBe("Completed task");
    expect(result.done[0].category).toBe("done");
    expect(result.all).toHaveLength(3);

    await upsertReminderChannelState(mockDb, {
      reminderKey: "key-1",
      notePath: "NoteA.md",
      dueAtUtc: "2026-10-14T08:00:00Z",
      text: "Overdue task",
      channels: ["desktop-default"],
      deliveryError: null,
    });
    expect(mockDb!.execute).toHaveBeenCalledTimes(1);
  });
});
