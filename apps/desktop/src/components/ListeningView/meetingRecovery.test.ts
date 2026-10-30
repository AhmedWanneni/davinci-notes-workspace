// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  saveActiveMeetingRecovery,
  loadActiveMeetingRecovery,
  clearActiveMeetingRecovery,
} from "./meetingRecovery";

describe("meetingRecovery", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    });
  });

  it("persists active meeting state and retrieves it cleanly", () => {
    saveActiveMeetingRecovery({
      meetingTitle: "Crash Recovery Test",
      durationMs: 45000,
      segments: [
        {
          id: "1",
          speaker: "me",
          text: "Important decision",
          startMs: 0,
          endMs: 2000,
          isFinal: true,
        },
      ],
    });

    const loaded = loadActiveMeetingRecovery();
    expect(loaded).not.toBeNull();
    expect(loaded?.meetingTitle).toBe("Crash Recovery Test");
    expect(loaded?.durationMs).toBe(45000);
    expect(loaded?.segments).toHaveLength(1);
  });

  it("clears recovery state cleanly", () => {
    saveActiveMeetingRecovery({ meetingTitle: "Temporary" });
    clearActiveMeetingRecovery();
    expect(loadActiveMeetingRecovery()).toBeNull();
  });
});
