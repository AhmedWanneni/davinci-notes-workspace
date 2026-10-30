import { describe, it, expect, vi } from "vitest";
import {
  reminderRowToCalendarEvent,
  getVaultRemindersOverlayEvents,
  type ReminderQueryDb,
} from "./vaultRemindersOverlay";

describe("vaultRemindersOverlay", () => {
  it("maps a vault reminder row to a read-only NormalizedCalendarEvent", () => {
    const evt = reminderRowToCalendarEvent({
      id: 42,
      note_path: "Daily/2026-04-16.md",
      line: 12,
      due_at_utc: "2026-04-16T14:00:00.000Z",
      tz: "UTC",
      text: "Follow up on design spec",
      done: 0,
    });

    expect(evt.id).toBe("reminder_42");
    expect(evt.calendarId).toBe("vault_reminders");
    expect(evt.title).toBe("🔔 Follow up on design spec");
    expect(evt.startIso).toBe("2026-04-16T14:00:00.000Z");
    expect(evt.endIso).toBe("2026-04-16T14:30:00.000Z");
    expect(evt.location).toBe("Daily/2026-04-16.md");
  });

  it("queries open reminders in range via withDbLock", async () => {
    const mockDb: ReminderQueryDb = {
      select: vi.fn().mockResolvedValue([
        {
          id: 7,
          note_path: "Projects/Roadmap.md",
          line: 5,
          due_at_utc: "2026-04-17T09:00:00.000Z",
          tz: "UTC",
          text: "Ship Calendar v1",
          done: 0,
        },
      ]),
    };

    const events = await getVaultRemindersOverlayEvents(
      "2026-04-01T00:00:00.000Z",
      "2026-04-30T23:59:59.000Z",
      mockDb
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe("reminder_7");
    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });
});
