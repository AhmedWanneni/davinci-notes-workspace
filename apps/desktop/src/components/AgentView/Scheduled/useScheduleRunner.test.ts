// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScheduleRunner } from "./useScheduleRunner";
import { useScheduleStore, type ScheduledTask } from "./useScheduleStore";

vi.mock("./scheduleVaultStorage", () => ({
  loadSchedulesFromVault: vi.fn(async () => []),
  saveSchedulesToVault: vi.fn(async () => undefined),
}));

const task = (nextRunUtc: string, enabled = true): ScheduledTask => ({
  id: "t1",
  title: "Daily Outfit",
  prompt: "Suggest an outfit",
  recurrence: { type: "daily", timeUtc: "08:00" },
  enabled,
  nextRunUtc,
});

describe("useScheduleRunner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T07:59:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("fires a task exactly when its time arrives and advances it", async () => {
    useScheduleStore.setState({ schedules: [task("2026-11-04T08:00:00Z")], isLoaded: true });
    const runTask = vi.fn();
    renderHook(() => useScheduleRunner({ isBusy: false, runTask }));

    expect(runTask).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });

    expect(runTask).toHaveBeenCalledTimes(1);
    expect(runTask.mock.calls[0][0].title).toBe("Daily Outfit");
    expect(useScheduleStore.getState().schedules[0].nextRunUtc).toBe(
      "2026-11-05T08:00:00.000Z",
    );
  });

  it("waits while the agent is busy and skips paused tasks", async () => {
    useScheduleStore.setState({ schedules: [task("2026-11-04T07:00:00Z")], isLoaded: true });
    const runTask = vi.fn();
    const { rerender } = renderHook(
      ({ busy }) => useScheduleRunner({ isBusy: busy, runTask }),
      { initialProps: { busy: true } },
    );
    expect(runTask).not.toHaveBeenCalled();
    await act(async () => rerender({ busy: false }));
    expect(runTask).toHaveBeenCalledTimes(1);

    runTask.mockClear();
    useScheduleStore.setState({ schedules: [task("2026-11-04T07:00:00Z", false)] });
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(runTask).not.toHaveBeenCalled();
  });
});
