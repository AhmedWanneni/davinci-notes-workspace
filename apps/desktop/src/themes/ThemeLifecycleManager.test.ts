// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeLifecycleManager } from "./ThemeLifecycleManager";
import type { ThemeFileSystemAdapter, ThemeStateStorage } from "./themeTypes";

const manifests = {
  themeA: {
    id: "theme-a",
    name: "Theme A",
    version: "1.0.0",
    minAppVersion: "0.1.0",
    author: "Test",
    description: "A",
    styles: "styles.css",
  },
  themeB: {
    id: "theme-b",
    name: "Theme B",
    version: "1.0.0",
    minAppVersion: "0.1.0",
    author: "Test",
    description: "B",
    styles: "styles.css",
  },
};

function createAdapter(): ThemeFileSystemAdapter {
  const css = {
    themeA:
      ".fixture-target { color: rgb(200, 20, 20); background: rgb(250, 230, 230); }",
    themeB:
      ".fixture-target { color: rgb(20, 20, 200); background: rgb(230, 230, 250); }",
  };
  return {
    listThemeDirectories: async () => ["themeA", "themeB", "malformed"],
    readThemeFile: async (dirName, relativePath) => {
      if (relativePath === "manifest.json" && dirName === "malformed")
        return '{"id":"broken","version":"1.0"}';
      if (relativePath === "manifest.json")
        return JSON.stringify(manifests[dirName as keyof typeof manifests]);
      return css[dirName as keyof typeof css];
    },
  };
}

function createStorage(): ThemeStateStorage {
  let active: string | null = null;
  return {
    loadActiveThemeId: async () => active,
    saveActiveThemeId: async (themeId) => {
      active = themeId;
    },
  };
}

describe("ThemeLifecycleManager", () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<style id="base-theme">.fixture-target { color: rgb(10, 10, 10); }</style>';
    document.body.innerHTML = '<div class="fixture-target">fixture</div>';
  });

  it("discovers valid themes while isolating malformed manifests", async () => {
    const manager = new ThemeLifecycleManager(createAdapter(), createStorage());
    await manager.initialize();
    expect(manager.getThemes().map(({ id }) => id)).toEqual([
      "theme-a",
      "theme-b",
    ]);
    expect(manager.getDiscoveryErrors()[0].error).toContain(
      'Required field "name"',
    );
  });

  it("switches computed styles and removes the previous stylesheet", async () => {
    const manager = new ThemeLifecycleManager(createAdapter(), createStorage());
    await manager.initialize();
    const target = document.querySelector<HTMLElement>(".fixture-target")!;
    await manager.activateTheme("theme-a");
    expect(getComputedStyle(target).color).toBe("rgb(200, 20, 20)");
    await manager.activateTheme("theme-b");
    expect(getComputedStyle(target).color).toBe("rgb(20, 20, 200)");
    expect(document.querySelectorAll("style[data-davinci-theme]")).toHaveLength(
      1,
    );
    expect(document.head.textContent).not.toContain("rgb(200, 20, 20)");
    await manager.activateTheme(null);
    expect(getComputedStyle(target).color).toBe("rgb(10, 10, 10)");
    expect(document.querySelectorAll("style[data-davinci-theme]")).toHaveLength(
      0,
    );
  });

  it("keeps one style node during rapid repeated switching", async () => {
    const manager = new ThemeLifecycleManager(createAdapter(), createStorage());
    await manager.initialize();
    for (let index = 0; index < 6; index += 1) {
      await manager.activateTheme(index % 2 === 0 ? "theme-a" : "theme-b");
      expect(
        document.querySelectorAll("style[data-davinci-theme]"),
      ).toHaveLength(1);
    }
  });

  it("preserves URL and import constructs for registry review", async () => {
    const externalCss =
      "@import url(https://cdn.example.test/theme.css); .fixture-target { background-image: url(https://cdn.example.test/bg.png); }";
    const adapter: ThemeFileSystemAdapter = {
      listThemeDirectories: async () => ["external"],
      readThemeFile: async (_dirName, relativePath) =>
        relativePath === "manifest.json"
          ? JSON.stringify({ ...manifests.themeA, id: "external" })
          : externalCss,
    };
    const manager = new ThemeLifecycleManager(adapter, createStorage());
    await manager.initialize();
    await manager.activateTheme("external");

    expect(
      document.querySelector<HTMLStyleElement>("style[data-davinci-theme]")
        ?.textContent,
    ).toBe(externalCss);
  });
});
