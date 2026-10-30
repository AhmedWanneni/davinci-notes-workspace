import { describe, it, expect } from "vitest";
import {
  normalizeReminder,
  mergeUniqueReminders,
  type RawReminderPayload,
} from "./normalizeToastReminder";

describe("normalizeReminder", () => {
  it("normalizes snake_case Rust payload into camelCase ActiveToastReminder", () => {
    const raw: RawReminderPayload = {
      id: 42,
      reminder_key: "abc123hash",
      note_path: "Projects/Sprint.md",
      line: 15,
      due_at_utc: "2026-10-26T14:00:00Z",
      tz: "UTC",
      text: "Review pull request",
      done: false,
    };

    const result = normalizeReminder(raw);
    expect(result).toEqual({
      id: 42,
      reminderKey: "abc123hash",
      notePath: "Projects/Sprint.md",
      line: 15,
      dueAtUtc: "2026-10-26T14:00:00Z",
      text: "Review pull request",
    });
  });

  it("preserves camelCase properties when already normalized", () => {
    const raw: RawReminderPayload = {
      id: 10,
      reminderKey: "key-xyz",
      notePath: "Notes/Daily.md",
      line: 3,
      dueAtUtc: "2026-10-27T09:00:00Z",
      text: "Daily standup",
    };

    const result = normalizeReminder(raw);
    expect(result.notePath).toBe("Notes/Daily.md");
    expect(result.reminderKey).toBe("key-xyz");
    expect(result.dueAtUtc).toBe("2026-10-27T09:00:00Z");
  });

  it("handles missing optional fields with safe defaults", () => {
    const raw = {
      id: 1,
    } as RawReminderPayload;

    const result = normalizeReminder(raw);
    expect(result.notePath).toBe("");
    expect(result.line).toBe(1);
    expect(result.dueAtUtc).toBe("");
    expect(result.text).toBe("");
  });
});

describe("mergeUniqueReminders", () => {
  it("deduplicates identical reminders by reminderKey", () => {
    const existing = [
      {
        id: 1,
        reminderKey: "key-1",
        notePath: "A.md",
        line: 1,
        dueAtUtc: "2026-10-26T10:00:00Z",
        text: "Task 1",
      },
    ];
    const incoming = [
      {
        id: 1,
        reminderKey: "key-1",
        notePath: "A.md",
        line: 1,
        dueAtUtc: "2026-10-26T10:00:00Z",
        text: "Task 1",
      },
      {
        id: 2,
        reminderKey: "key-2",
        notePath: "B.md",
        line: 2,
        dueAtUtc: "2026-10-26T11:00:00Z",
        text: "Task 2",
      },
    ];

    const merged = mergeUniqueReminders(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe(1);
    expect(merged[1].id).toBe(2);
  });
});
