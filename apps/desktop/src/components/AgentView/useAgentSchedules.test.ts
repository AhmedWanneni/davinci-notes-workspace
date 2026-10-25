// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAgentSchedules } from "./useAgentSchedules";
import * as vaultCommands from "../../vault/vaultCommands";

vi.mock("../../vault/vaultCommands", () => ({
  readNote: vi.fn(),
}));

describe("useAgentSchedules", () => {
  it("loads schedules and detects missed tasks when app was closed", async () => {
    const mockSchedules = JSON.stringify([
      {
        id: "task-missed-1",
        title: "Weekly Planning",
        prompt: "Review notes",
        recurrence: { type: "weekly", dayOfWeek: 0, timeUtc: "18:00" },
        enabled: true,
        nextRunUtc: "2026-10-20T18:00:00Z", // In the past (> 1 hour)
      },
    ]);

    vi.spyOn(vaultCommands, "readNote").mockResolvedValue({
      path: ".davinci/agent/schedules.json",
      content: mockSchedules,
    });

    const { result } = renderHook(() => useAgentSchedules());

    await act(async () => {
      await result.current.reloadSchedules();
    });

    expect(result.current.schedules).toHaveLength(1);
    expect(result.current.missedSchedules).toHaveLength(1);
    expect(result.current.missedSchedules[0].title).toBe("Weekly Planning");

    act(() => {
      result.current.dismissMissed();
    });

    expect(result.current.missedSchedules).toHaveLength(0);
  });
});
