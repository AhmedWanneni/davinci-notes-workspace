// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_CURSOR_COLOR,
  CURSOR_COLOR_PRESETS,
  applyCursorColor,
  loadSavedCursorColor,
  saveCursorColor,
} from "./cursorColor";

describe("cursorColor utilities", () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, val: string) => {
          store[key] = val;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
      writable: true,
      configurable: true,
    });
    document.documentElement.style.removeProperty("--color-editor-cursor");
  });

  it("applies and removes cursor color from documentElement", () => {
    applyCursorColor("#ff0000");
    expect(
      document.documentElement.style.getPropertyValue("--color-editor-cursor"),
    ).toBe("#ff0000");

    applyCursorColor("default");
    expect(
      document.documentElement.style.getPropertyValue("--color-editor-cursor"),
    ).toBe("");
  });

  it("persists and reads saved cursor color from localStorage", () => {
    saveCursorColor("#00ff00");
    expect(loadSavedCursorColor()).toBe("#00ff00");

    saveCursorColor(DEFAULT_CURSOR_COLOR);
    expect(loadSavedCursorColor()).toBeNull();
  });

  it("contains valid cursor color presets", () => {
    expect(CURSOR_COLOR_PRESETS.length).toBeGreaterThan(3);
    expect(CURSOR_COLOR_PRESETS.some((p) => p.id === "default")).toBe(true);
  });
});
