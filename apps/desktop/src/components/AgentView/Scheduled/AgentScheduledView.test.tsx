// @vitest-environment jsdom
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentScheduledView } from "./AgentScheduledView";
import { useScheduleStore } from "./useScheduleStore";

vi.mock("./scheduleVaultStorage", () => ({
  loadSchedulesFromVault: vi.fn(async () => []),
  saveSchedulesToVault: vi.fn(async () => undefined),
}));

describe("AgentScheduledView", () => {
  beforeEach(() => {
    act(() => {
      useScheduleStore.setState({ schedules: [], isLoaded: true, lastCreatedId: null });
    });
  });

  it("shows the Scheduled title, prompt bar and recommended prompts", () => {
    render(<AgentScheduledView />);
    expect(screen.getByRole("heading", { name: "Scheduled" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Schedule a task")).toBeTruthy();
    expect(screen.getByText("News updates")).toBeTruthy();
    expect(screen.getByText("Recommend a book")).toBeTruthy();
  });

  it("schedules a recommendation and shows the Created notice", async () => {
    render(<AgentScheduledView />);
    fireEvent.click(screen.getByRole("button", { name: "Schedule Outfit ideas" }));
    const dialog = await screen.findByRole("dialog");
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Schedule" }));
    });

    const { schedules } = useScheduleStore.getState();
    expect(schedules).toHaveLength(1);
    expect(schedules[0].title).toBe("Outfit ideas");
    expect(screen.getByRole("status").textContent).toContain("Created");
    expect(screen.getByRole("status").textContent).toContain("Every day at 8:00 AM");
    // Already-scheduled recommendation is no longer offered.
    expect(screen.queryByRole("button", { name: "Schedule Outfit ideas" })).toBeNull();
  });

  it("turns a free-text request into a pre-filled draft", async () => {
    render(<AgentScheduledView />);
    fireEvent.change(screen.getByPlaceholderText("Schedule a task"), {
      target: { value: "Every Friday at 7pm pick three movies" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create schedule" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByDisplayValue("19:00") as HTMLInputElement).type).toBe("time");
    expect(within(dialog).getByDisplayValue("Friday")).toBeTruthy();
  });

  it("pauses and deletes a task", async () => {
    await act(async () => {
      await useScheduleStore.getState().addSchedule({
        title: "Plan workouts",
        prompt: "Plan my week",
        spec: { frequency: "weekly", time: "18:00", dayOfWeek: 0, intervalHours: 24 },
      });
    });
    render(<AgentScheduledView />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pause Plan workouts" }));
    });
    expect(useScheduleStore.getState().schedules[0].enabled).toBe(false);
    expect(screen.getByText(/Paused/)).toBeTruthy();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Plan workouts" }));
    });
    expect(useScheduleStore.getState().schedules).toHaveLength(0);
  });
});
