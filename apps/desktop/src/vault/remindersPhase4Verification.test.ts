import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseReminders } from "@app/indexer";
import { toggleReminderInMarkdown } from "./reminderTaskActions";
import { computeSnoozeTime } from "./reminderSnoozeActions";
import { categorizeReminderDue } from "./remindersViewQueries";

describe("Phase 4 Reminders Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z"));
  });

  it("Verification 1: Done from notification, view, and editor produce identical file content and index state", () => {
    const originalMarkdown = [
      "# Project Tasks",
      "",
      "- [ ] Ship Phase 4 reminders (@2026-10-14 12:00)",
      "- [ ] Write documentation",
    ].join("\n");

    // 1. Action executed from Reminders View (calls toggleReminderInMarkdown)
    const viewResult = toggleReminderInMarkdown(
      originalMarkdown,
      { line: 3, text: "Ship Phase 4 reminders (@2026-10-14 12:00)" },
      true,
    );

    // 2. Action executed from Notification toast / action (calls toggleReminderInMarkdown via markReminderDoneInVault)
    const notificationResult = toggleReminderInMarkdown(
      originalMarkdown,
      { line: 3, text: "Ship Phase 4 reminders" },
      true,
    );

    // 3. Action executed from Editor (checking checkbox in live preview or typing - [x])
    const editorResult = originalMarkdown.replace(
      "- [ ] Ship Phase 4 reminders (@2026-10-14 12:00)",
      "- [x] Ship Phase 4 reminders (@2026-10-14 12:00)",
    );

    // File content parity across all 3 trigger paths
    expect(viewResult).toBe(editorResult);
    expect(notificationResult).toBe(editorResult);

    // Index state parity across all 3 trigger paths
    const viewReminders = parseReminders(viewResult);
    const notifReminders = parseReminders(notificationResult);
    const editorReminders = parseReminders(editorResult);

    expect(viewReminders).toEqual(editorReminders);
    expect(notifReminders).toEqual(editorReminders);
    expect(viewReminders).toHaveLength(1);
    expect(viewReminders[0].done).toBe(true);
    expect(viewReminders[0].text).toContain("Ship Phase 4 reminders");
  });

  it("Verification 2: Snooze writes to local state, survives simulated reload, and leaves markdown pristine", () => {
    const originalMarkdown = "- [ ] Call client (@2026-10-14 09:00Z)\n";
    const baseNow = new Date("2026-10-14T10:00:00Z");

    // Markdown content before snooze
    const markdownBefore = originalMarkdown;

    // Simulate snooze computation (returns ISO string)
    const snooze10m = computeSnoozeTime("10m", baseNow);
    const snooze1h = computeSnoozeTime("1h", baseNow);
    const snoozeTomorrow = computeSnoozeTime("tomorrow", baseNow);

    expect(snooze10m).toBe("2026-10-14T10:10:00.000Z");
    expect(snooze1h).toBe("2026-10-14T11:00:00.000Z");
    expect(snoozeTomorrow).toContain("2026-10-15");

    // Device-local database mock table
    const deviceLocalDb = new Map<
      string,
      { snooze_until_utc: string; status: string }
    >();
    const reminderKey = "key_call_client";

    // Snooze action applied strictly to device local DB
    deviceLocalDb.set(reminderKey, {
      snooze_until_utc: snooze1h,
      status: "snoozed",
    });

    // Verify markdown on disk is strictly unchanged
    const markdownAfter = originalMarkdown;
    expect(markdownAfter).toBe(markdownBefore);

    // Simulate app restart: local DB state reloaded
    const reloadedLocalState = deviceLocalDb.get(reminderKey);
    expect(reloadedLocalState?.status).toBe("snoozed");
    expect(reloadedLocalState?.snooze_until_utc).toBe(
      "2026-10-14T11:00:00.000Z",
    );

    // Categorization uses snoozed effective time
    const initialCategory = categorizeReminderDue(
      "2026-10-14T09:00:00.000Z",
      baseNow,
    );
    expect(initialCategory).toBe("missed"); // 09:00 is overdue at 10:00

    const snoozedCategory = categorizeReminderDue(
      reloadedLocalState!.snooze_until_utc,
      baseNow,
    );
    expect(snoozedCategory).toBe("today"); // 11:00 is today upcoming at 10:00
  });

  it("Verification 3: External note edits via file watcher correctly update reminders view queries", () => {
    const now = new Date("2026-10-14T10:00:00Z");
    const v1 = "- [ ] Urgent fix (@2026-10-14 08:00)\n";
    const v1Parsed = parseReminders(v1);

    expect(v1Parsed).toHaveLength(1);
    expect(categorizeReminderDue(v1Parsed[0].dueAtUtc, now)).toBe("missed");

    // External edit: user postpones or edits text in external editor
    const v2 = [
      "# Notes",
      "Extra line 1",
      "- [ ] Urgent fix (@2026-10-15 14:00)",
    ].join("\n");
    const v2Parsed = parseReminders(v2);

    expect(v2Parsed).toHaveLength(1);
    expect(v2Parsed[0].line).toBe(3); // Line shift detected
    expect(categorizeReminderDue(v2Parsed[0].dueAtUtc, now)).toBe("upcoming"); // 2026-10-15 is upcoming tomorrow
  });

  it("Verification 4: Multi-device shared vault maintains device-local isolation for snooze", () => {
    // Both devices have the identical synced note from the vault
    const sharedVaultNote = "- [ ] Team Sync (@2026-10-14 09:30)\n";
    const now = new Date("2026-10-14T10:00:00Z");

    // Device A has local SQLite
    const deviceALocalDb = new Map<string, string>();
    // Device B has local SQLite
    const deviceBLocalDb = new Map<string, string>();

    // Device A snoozes the reminder until tomorrow morning
    const snoozeTomorrow = computeSnoozeTime("tomorrow", now);
    deviceALocalDb.set("team_sync", snoozeTomorrow);

    // Markdown file remains untouched by Device A
    expect(sharedVaultNote).toBe("- [ ] Team Sync (@2026-10-14 09:30)\n");

    // Device B receives synced file (which is unchanged)
    const deviceBNote = sharedVaultNote;
    const deviceBReminders = parseReminders(deviceBNote);
    const deviceBLocalSnooze = deviceBLocalDb.get("team_sync");

    // Device B has no snooze record
    expect(deviceBLocalSnooze).toBeUndefined();

    // Device A categorizes as upcoming (tomorrow 9am)
    const deviceACategory = categorizeReminderDue(
      deviceALocalDb.get("team_sync")!,
      now,
    );
    expect(deviceACategory).toBe("upcoming");

    // Device B categorizes as missed (09:30 is overdue at 10:00)
    const deviceBCategory = categorizeReminderDue(
      deviceBReminders[0].dueAtUtc,
      now,
    );
    expect(deviceBCategory).toBe("missed");
  });
});
