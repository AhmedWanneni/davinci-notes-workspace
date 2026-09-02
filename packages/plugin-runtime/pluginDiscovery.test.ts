import { describe, expect, it } from "vitest";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe("plugin discovery", () => {
  it("skips malformed manifests without blocking valid plugins", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();

    fs.setFile(
      "bad-manifest-plugin",
      "manifest.json",
      JSON.stringify({
        id: "bad-manifest-plugin",
        version: "not-a-semver",
        minAppVersion: "0.1.0",
        description: "Missing name and bad version",
        author: "Nobody",
        main: "main.js",
      }),
    );
    fs.setFile(
      "bad-manifest-plugin",
      "main.js",
      "module.exports = class extends DavinciPlugin {};",
    );
    addPluginFixture(fs, "valid-plugin");

    const manager = new PluginLifecycleManager({ fsAdapter: fs, storage });
    await manager.initialize();

    const errors = manager.getDiscoveryErrors();
    expect(errors[0].dirName).toBe("bad-manifest-plugin");
    expect(errors[0].error).toContain('Required field "name" is missing');
    expect(errors[0].error).toContain('Invalid version "not-a-semver"');
    expect(manager.getPlugin("valid-plugin")).toBeDefined();
    expect(manager.getPlugin("bad-manifest-plugin")).toBeUndefined();
  });

  it("rejects duplicate plugin IDs and preserves the original folder", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();
    addPluginFixture(fs, "plugin-folder-a");
    addPluginFixture(fs, "plugin-folder-b");

    fs.setFile(
      "plugin-folder-a",
      "manifest.json",
      JSON.stringify({
        id: "duplicate-id",
        name: "Original Plugin",
        version: "1.0.0",
        minAppVersion: "0.1.0",
        description: "First folder",
        author: "Author A",
        main: "main.js",
      }),
    );
    fs.setFile(
      "plugin-folder-b",
      "manifest.json",
      JSON.stringify({
        id: "duplicate-id",
        name: "Colliding Plugin",
        version: "2.0.0",
        minAppVersion: "0.1.0",
        description: "Second folder collision",
        author: "Author B",
        main: "main.js",
      }),
    );

    const manager = new PluginLifecycleManager({ fsAdapter: fs, storage });
    await manager.initialize();

    const collision = manager
      .getDiscoveryErrors()
      .find((error) => error.error.includes("Plugin ID collision"));
    expect(collision?.error).toContain('ID "duplicate-id"');
    expect(manager.getPlugin("duplicate-id")?.dirName).toBe("plugin-folder-a");
    expect(manager.getPlugin("duplicate-id")?.manifest.name).toBe(
      "Original Plugin",
    );
  });
});
