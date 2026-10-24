import { describe, expect, it } from "vitest";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
  setPlatformAdapters,
  type PlatformAdapters,
} from "./PlatformContext";

describe("PlatformContext", () => {
  it("throws if getPlatformAdapters is called before initialization", () => {
    // Ensure clean state if previously set
    setPlatformAdapters(undefined);
    expect(hasPlatformAdapters()).toBe(false);
    expect(() => getPlatformAdapters()).toThrow(/not been initialized/);
  });

  it("stores and returns the active platform adapters", () => {
    const mockAdapters: Partial<PlatformAdapters> = {};

    setPlatformAdapters(mockAdapters);
    expect(hasPlatformAdapters()).toBe(true);
    expect(getPlatformAdapters()).toBe(mockAdapters);
  });
});
