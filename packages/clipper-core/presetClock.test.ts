import { describe, expect, it } from "vitest";
import { buildPresetClock, toLocalIso } from "./presetClock";

describe("buildPresetClock", () => {
  it("renders a local ISO date and a short time from an injected clock", () => {
    const now = new Date(2026, 9, 17, 9, 5, 7);
    expect(buildPresetClock(now)).toEqual({
      date: toLocalIso(now),
      time: "09:05",
    });
  });

  it("includes the local UTC offset", () => {
    const iso = toLocalIso(new Date(2026, 9, 17, 9, 5, 7));
    expect(iso).toMatch(/^2026-10-17T09:05:07[+-]\d{2}:\d{2}$/);
  });
});
