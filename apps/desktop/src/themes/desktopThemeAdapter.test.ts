// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const commands = vi.hoisted(() => ({
  listThemeDirectories: vi.fn(),
  readThemeFile: vi.fn(),
}));

vi.mock("../vault/vaultCommands", () => ({
  listThemeDirectories: commands.listThemeDirectories,
  readThemeFile: commands.readThemeFile,
}));

import { ThemeLifecycleManager } from "./ThemeLifecycleManager";
import {
  createDesktopThemeFsAdapter,
  createDesktopThemeStorage,
  applyThemeCss,
  restoreCachedBuiltinTheme,
} from "./desktopThemeAdapter";

const manifest = {
  id: "fixture-theme",
  name: "Fixture Theme",
  version: "1.0.0",
  minAppVersion: "0.1.0",
  author: "Test",
  description: "A real vault fixture theme.",
  styles: "theme.css",
};

describe("createDesktopThemeFsAdapter", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = '<div class="fixture-target">fixture</div>';
    vi.clearAllMocks();
    commands.listThemeDirectories.mockResolvedValue(["fixture-theme"]);
    commands.readThemeFile.mockImplementation(async (_dirName, relativePath) =>
      relativePath === "manifest.json"
        ? JSON.stringify(manifest)
        : ".fixture-target { color: rgb(20, 40, 60); }",
    );
  });

  it("discovers and activates a vault theme through Rust commands", async () => {
    const manager = new ThemeLifecycleManager(
      createDesktopThemeFsAdapter("/Volumes/External Notes"),
      {
        loadActiveThemeId: async () => null,
        saveActiveTheme: async () => {},
      },
      [],
    );

    await manager.initialize();
    await manager.activateTheme("fixture-theme");

    expect(manager.getThemes().map((theme) => theme.id)).toEqual([
      "fixture-theme",
    ]);
    expect(
      getComputedStyle(document.querySelector(".fixture-target")!).color,
    ).toBe("rgb(20, 40, 60)");
    expect(commands.listThemeDirectories).toHaveBeenCalledOnce();
    expect(commands.readThemeFile).toHaveBeenCalledWith(
      "fixture-theme",
      "manifest.json",
    );
    expect(commands.readThemeFile).toHaveBeenCalledWith(
      "fixture-theme",
      "theme.css",
    );
  });

  it("applies and removes theme CSS dynamically", () => {
    applyThemeCss("theme-a", ".custom { color: red; }");
    const style = document.querySelector("style[data-davinci-theme='theme-a']");
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe(".custom { color: red; }");

    applyThemeCss("theme-a", ".custom { color: blue; }");
    expect(style?.textContent).toBe(".custom { color: blue; }");

    applyThemeCss(null, null);
    expect(document.querySelector("style[data-davinci-theme]")).toBeNull();
  });

  it("restores cached theme from localStorage", async () => {
    const store = new Map<string, string>();
    const storageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: 0,
      key: () => null,
    };
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    const storage = createDesktopThemeStorage();
    await storage.saveActiveTheme("persisted-theme", ".p { color: green; }");

    const restoredId = restoreCachedBuiltinTheme();
    expect(restoredId).toBe("persisted-theme");
    const style = document.querySelector(
      "style[data-davinci-theme='persisted-theme']",
    );
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe(".p { color: green; }");
  });
});
