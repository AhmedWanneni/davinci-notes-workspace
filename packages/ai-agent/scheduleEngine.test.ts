import { describe, expect, it } from "vitest";
import {
  advanceScheduleAfterRun,
  appendScheduleRunRecord,
  computeNextRun,
  evaluatePendingSchedules,
  isScheduleDue,
  parseSchedulesFile,
  type AgentSchedule,
  type AgentScheduleRunRecord,
} from "./scheduleEngine.js";

describe("scheduleEngine", () => {
  it("computes next run for interval schedules", () => {
    const from = new Date("2026-10-25T10:00:00Z");
    const next = computeNextRun({ type: "interval", intervalHours: 4 }, from);
    expect(next.toISOString()).toBe("2026-10-25T14:00:00.000Z");
  });

  it("computes next daily run at specified UTC time", () => {
    // Current time is 08:00 UTC, target is 10:00 UTC -> same day
    const from1 = new Date("2026-10-25T08:00:00Z");
    const next1 = computeNextRun({ type: "daily", timeUtc: "10:00" }, from1);
    expect(next1.toISOString()).toBe("2026-10-25T10:00:00.000Z");

    // Current time is 12:00 UTC, target is 10:00 UTC -> next day (Oct 26)
    const from2 = new Date("2026-10-25T12:00:00Z");
    const next2 = computeNextRun({ type: "daily", timeUtc: "10:00" }, from2);
    expect(next2.toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });

  it("computes next weekly run correctly", () => {
    // 2026-10-25 is a Sunday (dayOfWeek: 0)
    const sundayMorning = new Date("2026-10-25T08:00:00Z");
    // Target: Sunday at 18:00 UTC -> same day at 18:00
    const next = computeNextRun({ type: "weekly", dayOfWeek: 0, timeUtc: "18:00" }, sundayMorning);
    expect(next.toISOString()).toBe("2026-10-25T18:00:00.000Z");

    // Target: Monday at 09:00 UTC -> Oct 26
    const nextMonday = computeNextRun({ type: "weekly", dayOfWeek: 1, timeUtc: "09:00" }, sundayMorning);
    expect(nextMonday.toISOString()).toBe("2026-10-26T09:00:00.000Z");
  });

  it("evaluates due and missed schedules preventing silent background execution", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    const schedules: AgentSchedule[] = [
      {
        id: "task-due-now",
        title: "Immediate task",
        prompt: "Check notes",
        recurrence: { type: "interval", intervalHours: 1 },
        enabled: true,
        nextRunUtc: "2026-10-25T11:45:00Z", // 15 mins ago -> due immediately
      },
      {
        id: "task-missed",
        title: "Weekly report missed while closed",
        prompt: "Prepare summary",
        recurrence: { type: "daily", timeUtc: "08:00" },
        enabled: true,
        nextRunUtc: "2026-10-23T08:00:00Z", // 2 days ago -> missed while closed
      },
      {
        id: "task-future",
        title: "Future task",
        prompt: "Later",
        recurrence: { type: "daily", timeUtc: "20:00" },
        enabled: true,
        nextRunUtc: "2026-10-25T20:00:00Z",
      },
    ];

    const { dueImmediately, missedWhileClosed } = evaluatePendingSchedules(schedules, now);
    expect(dueImmediately).toHaveLength(1);
    expect(dueImmediately[0].id).toBe("task-due-now");

    // Must be flagged for user review rather than executed silently
    expect(missedWhileClosed).toHaveLength(1);
    expect(missedWhileClosed[0].id).toBe("task-missed");
  });

  it("advances schedule timestamps after run", () => {
    const s: AgentSchedule = {
      id: "test",
      title: "Test",
      prompt: "run",
      recurrence: { type: "interval", intervalHours: 2 },
      enabled: true,
      nextRunUtc: "2026-10-25T10:00:00Z",
    };
    const advanced = advanceScheduleAfterRun(s, new Date("2026-10-25T10:00:00Z"));
    expect(advanced.lastRunUtc).toBe("2026-10-25T10:00:00.000Z");
    expect(advanced.nextRunUtc).toBe("2026-10-25T12:00:00.000Z");
  });

  it("appends and truncates schedule run records to 50 items", () => {
    let history: AgentScheduleRunRecord[] = [];
    for (let i = 0; i < 60; i++) {
      history = appendScheduleRunRecord(history, {
        id: `run-${i}`,
        scheduleId: "sched-1",
        scheduleTitle: "Daily sync",
        runAtUtc: new Date().toISOString(),
        status: "success",
      });
    }

    expect(history).toHaveLength(50);
    expect(history[0].id).toBe("run-59");
  });
});
