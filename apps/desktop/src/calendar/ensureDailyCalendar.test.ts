import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureDailyCalendar, findDailyCalendar } from "./ensureDailyCalendar";
import type { GoogleCalendarClient } from "@app/google-calendar-api";
import * as store from "./sqliteCalendarStore";

vi.mock("./sqliteCalendarStore", () => ({
  getCalendarsFromDb: vi.fn(),
  saveCalendarsToDb: vi.fn(),
  updateCalendarSelectedInDb: vi.fn(),
}));

describe("ensureDailyCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a Daily calendar case-insensitively", () => {
    const cals = [
      { id: "primary", summary: "Personal", primary: true },
      { id: "cal_daily_1", summary: "Daily" },
    ];
    expect(findDailyCalendar(cals)?.id).toBe("cal_daily_1");
  });

  it("uses existing Daily calendar in Google Calendar without creating a duplicate", async () => {
    vi.mocked(store.getCalendarsFromDb).mockResolvedValue([]);
    const mockClient = {
      listCalendars: vi.fn().mockResolvedValue([
        { id: "primary", summary: "Personal", primary: true, selected: true },
        { id: "remote_daily_id", summary: "Daily", primary: false, selected: true },
      ]),
      createCalendar: vi.fn(),
    } as unknown as GoogleCalendarClient;

    const result = await ensureDailyCalendar(mockClient, "mock-token");
    expect(result.id).toBe("remote_daily_id");
    expect(mockClient.createCalendar).not.toHaveBeenCalled();
    expect(store.saveCalendarsToDb).toHaveBeenCalled();
  });

  it("creates a Daily calendar in Google Calendar when none exists", async () => {
    vi.mocked(store.getCalendarsFromDb).mockResolvedValue([]);
    const mockClient = {
      listCalendars: vi.fn().mockResolvedValue([
        { id: "primary", summary: "Personal", primary: true, selected: true },
      ]),
      createCalendar: vi.fn().mockResolvedValue({
        id: "created_daily_id",
        summary: "Daily",
        primary: false,
        selected: true,
      }),
    } as unknown as GoogleCalendarClient;

    const result = await ensureDailyCalendar(mockClient, "mock-token");
    expect(mockClient.createCalendar).toHaveBeenCalledWith("mock-token", "Daily");
    expect(result.id).toBe("created_daily_id");
    expect(store.saveCalendarsToDb).toHaveBeenCalledWith([
      expect.objectContaining({ id: "created_daily_id", summary: "Daily", selected: true }),
    ]);
  });
});
