import { describe, expect, it } from "vitest";
import { createDesktopPlatformAdapters } from "./createDesktopPlatformAdapters";

describe("createDesktopPlatformAdapters", () => {
  it("initializes all required platform adapters", () => {
    const adapters = createDesktopPlatformAdapters();
    expect(adapters.fs).toBeDefined();
    expect(adapters.watcher).toBeDefined();
    expect(adapters.sqlite).toBeDefined();
    expect(adapters.dialog).toBeDefined();
    expect(adapters.secrets).toBeDefined();
    expect(adapters.windowControls).toBeDefined();
    expect(adapters.externalUrl).toBeDefined();
    expect(adapters.notifications).toBeDefined();
    expect(adapters.vaultRegistry).toBeDefined();
  });
});
