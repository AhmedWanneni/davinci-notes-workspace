// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  applyAccentColor,
  loadSavedAccentColor,
  saveAccentColor,
  DEFAULT_ACCENT_COLOR,
  ACCENT_COLOR_PRESETS,
} from "./accentColor";

describe("accentColor", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const storageMock: Storage = {
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
      length: 0,
      key: () => null,
    };
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    applyAccentColor(null);
  });

  it("has magenta as the default accent color", () => {
    expect(DEFAULT_ACCENT_COLOR).toBe("#cd47ab");
    expect(ACCENT_COLOR_PRESETS[0].value).toBe("#cd47ab");
  });

  it("applies and removes accent color CSS variables on document.documentElement", () => {
    applyAccentColor("#cd47ab");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--color-interactive-accent")).toBe("#cd47ab");
    expect(style.getPropertyValue("--color-text-accent")).toBe("#cd47ab");
    expect(style.getPropertyValue("--color-border-focus")).toBe("#cd47ab");

    applyAccentColor(null);
    expect(style.getPropertyValue("--color-interactive-accent")).toBe("");
  });

  it("persists and restores accent color in localStorage", () => {
    expect(loadSavedAccentColor()).toBeNull();
    saveAccentColor("#7f6df2");
    expect(loadSavedAccentColor()).toBe("#7f6df2");
    saveAccentColor(null);
    expect(loadSavedAccentColor()).toBeNull();
  });
});
