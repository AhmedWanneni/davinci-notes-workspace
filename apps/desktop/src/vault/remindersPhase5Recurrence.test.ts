import { describe, it, expect } from "vitest";
import {
  parseRecurrenceRule,
  computeNextOccurrenceDate,
  advanceRecurringReminder,
  parseReminders,
} from "@app/indexer";
import { toggleReminderInMarkdown } from "./reminderTaskActions";

describe("Phase 5 Reminders Recurrence Verification", () => {
  describe("Verification 1: Month-end, leap days, and DST", () => {
    it("handles monthly on the 31st across an entire year without date drifting", () => {
      const rule = parseRecurrenceRule("every month on 31st")!;
      let current = { year: 2026, month: 1, day: 31 };

      const expected = [
        { year: 2026, month: 2, day: 28 }, // Feb (28 days)
        { year: 2026, month: 3, day: 31 }, // Mar (31 days)
        { year: 2026, month: 4, day: 30 }, // Apr (30 days)
        { year: 2026, month: 5, day: 31 }, // May (31 days)
        { year: 2026, month: 6, day: 30 }, // Jun (30 days)
        { year: 2026, month: 7, day: 31 }, // Jul (31 days)
        { year: 2026, month: 8, day: 31 }, // Aug (31 days)
        { year: 2026, month: 9, day: 30 }, // Sep (30 days)
        { year: 2026, month: 10, day: 31 }, // Oct (31 days)
        { year: 2026, month: 11, day: 30 }, // Nov (30 days)
        { year: 2026, month: 12, day: 31 }, // Dec (31 days)
        { year: 2027, month: 1, day: 31 }, // Jan (31 days)
      ];

      for (const target of expected) {
        current = computeNextOccurrenceDate(current, rule, 31);
        expect(current).toEqual(target);
      }
    });

    it("handles Feb 29 yearly across leap and non-leap years", () => {
      const rule = parseRecurrenceRule("every year on feb 29")!;
      let current = { year: 2024, month: 2, day: 29 };

      // 2025 non-leap -> Feb 28
      current = computeNextOccurrenceDate(current, rule);
      expect(current).toEqual({ year: 2025, month: 2, day: 28 });

      // 2026 non-leap -> Feb 28
      current = computeNextOccurrenceDate(current, rule);
      expect(current).toEqual({ year: 2026, month: 2, day: 28 });

      // 2027 non-leap -> Feb 28
      current = computeNextOccurrenceDate(current, rule);
      expect(current).toEqual({ year: 2027, month: 2, day: 28 });

      // 2028 leap year -> Feb 29
      current = computeNextOccurrenceDate(current, rule);
      expect(current).toEqual({ year: 2028, month: 2, day: 29 });
    });

    it("handles weekly recurrence across a DST change preserving local wall-clock time", () => {
      // Oct 19, 2026 in London is BST (UTC+1) -> 10:00 AM local = 09:00:00Z
      // Oct 26, 2026 in London is GMT (UTC+0) -> 10:00 AM local = 10:00:00Z
      const result = advanceRecurringReminder(
        "2026-10-19",
        "10:00",
        "/weekly",
        "Europe/London",
      );

      expect(result).not.toBeNull();
      expect(result?.nextDateStr).toBe("2026-10-26");
      expect(result?.nextTimeStr).toBe("10:00");
      expect(result?.nextDueAtUtc).toBe("2026-10-26T10:00:00.000Z");
      expect(result?.nextTokenStr).toBe("(@2026-10-26 10:00 /weekly)");
    });
  });

  describe("Verification 2: Completing three times in a row", () => {
    it("completes three times in a row in a real Markdown document with in-place roll forward", () => {
      let doc = [
        "# Projects",
        "",
        "- [ ] Weekly team sync (@2026-10-14 09:00 /weekly)",
        "- [ ] Review PRs",
      ].join("\n");

      // Completion 1
      doc = toggleReminderInMarkdown(
        doc,
        { line: 3, text: "Weekly team sync" },
        true,
      );
      expect(doc).toContain(
        "- [ ] Weekly team sync (@2026-10-21 09:00 /weekly)",
      );

      // Completion 2
      doc = toggleReminderInMarkdown(
        doc,
        { line: 3, text: "Weekly team sync" },
        true,
      );
      expect(doc).toContain(
        "- [ ] Weekly team sync (@2026-10-28 09:00 /weekly)",
      );

      // Completion 3
      doc = toggleReminderInMarkdown(
        doc,
        { line: 3, text: "Weekly team sync" },
        true,
      );
      expect(doc).toContain(
        "- [ ] Weekly team sync (@2026-11-04 09:00 /weekly)",
      );

      // Parse reminders from document to verify indexer compatibility
      const parsed = parseReminders(doc);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].done).toBe(false); // Checkbox remains open
      expect(parsed[0].recurrence).toBe("weekly");
      expect(parsed[0].dueAtUtc).toContain("2026-11-04");
    });
  });

  describe("Verification 3: Two synced devices completing the same recurring task", () => {
    it("does not double advance the recurrence when completed independently on two devices", () => {
      // Both devices start with identical shared vault note
      const sharedInitialDoc = [
        "# Finance",
        "- [ ] Pay monthly bills (@2026-10-15 12:00 /monthly)",
      ].join("\n");

      // Device A completes the task offline
      const deviceADoc = toggleReminderInMarkdown(
        sharedInitialDoc,
        { line: 2, text: "Pay monthly bills" },
        true,
      );

      // Device B completes the exact same task offline (perhaps hours later)
      const deviceBDoc = toggleReminderInMarkdown(
        sharedInitialDoc,
        { line: 2, text: "Pay monthly bills" },
        true,
      );

      // Expected result on both devices:
      // Due date is deterministically advanced from 2026-10-15 -> 2026-11-15
      const expectedDoc = [
        "# Finance",
        "- [ ] Pay monthly bills (@2026-11-15 12:00 /monthly)",
      ].join("\n");

      expect(deviceADoc).toBe(expectedDoc);
      expect(deviceBDoc).toBe(expectedDoc);

      // When sync engine reconciles the two versions:
      // Since both versions produced the exact same byte-for-byte text,
      // diff is empty and no double advance (e.g. to Dec 15) occurs!
      expect(deviceADoc).toBe(deviceBDoc);

      const parsedA = parseReminders(deviceADoc);
      const parsedB = parseReminders(deviceBDoc);
      expect(parsedA).toEqual(parsedB);
      expect(parsedA[0].dueAtUtc).toContain("2026-11-15");
    });
  });
});
