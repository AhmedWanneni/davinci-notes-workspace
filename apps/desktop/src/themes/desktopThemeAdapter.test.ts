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
import { createDesktopThemeFsAdapter } from "./desktopThemeAdapter";

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
});
