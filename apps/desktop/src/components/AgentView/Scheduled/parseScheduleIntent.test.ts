import { describe, expect, it } from "vitest";
import { deriveTitle, parseScheduleIntent } from "./parseScheduleIntent";

describe("parseScheduleIntent", () => {
  it("detects 'every morning' as daily at 8:00", () => {
    const d = parseScheduleIntent(
      "Every morning, suggest an easy outfit using everyday basics.",
    );
    expect(d.spec).toMatchObject({ frequency: "daily", time: "08:00" });
    expect(d.title).toBe("Suggest an easy outfit using everyday");
    expect(d.prompt).toContain("suggest an easy outfit");
  });

  it("detects weekday + explicit pm time as weekly", () => {
    const d = parseScheduleIntent("Every Friday at 7pm pick three movies for me");
    expect(d.spec).toMatchObject({ frequency: "weekly", dayOfWeek: 5, time: "19:00" });
  });

  it("detects hourly intervals", () => {
    expect(parseScheduleIntent("Every 3 hours check my inbox note").spec).toMatchObject({
      frequency: "interval",
      intervalHours: 3,
    });
  });

  it("maps monthly to a 30-day interval", () => {
    expect(parseScheduleIntent("Monthly, recommend three books").spec).toMatchObject({
      frequency: "interval",
      intervalHours: 720,
    });
  });

  it("parses 24h 'at HH:mm' times", () => {
    expect(parseScheduleIntent("Daily at 06:45 summarize my todos").spec.time).toBe("06:45");
  });

  it("falls back to a usable title", () => {
    expect(deriveTitle("   ")).toBe("Scheduled task");
  });
});
