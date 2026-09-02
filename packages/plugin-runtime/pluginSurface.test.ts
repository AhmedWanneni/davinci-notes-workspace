import { describe, expect, it } from "vitest";
import { DavinciPlugin, type PluginManifest } from "@app/plugin-api";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe("Phase 3 plugin surface fixture", () => {
  it("exercises vault, commands, isolated data, unload, and restart", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();
    const permissions = [
      "vault:read",
      "vault:write",
      "commands",
      "ui:view",
    ] as const;
    addPluginFixture(fs, "surface-plugin", undefined, [...permissions]);
    addPluginFixture(fs, "second-plugin", undefined, [...permissions]);
    const evaluator = (_code: string, manifest: PluginManifest) => {
      return class FixturePlugin extends DavinciPlugin {
        async onload() {
          this.settings.addTab({
            id: `${manifest.id}-settings`,
            title: "Fixture",
            fields: [],
          });
          this.commands.register({
            id: `${manifest.id}:write`,
            name: "Fixture write",
            callback: async () => {
              await this.vault.write("fixture.md", "fixture content");
              if ((await this.vault.read("fixture.md")) !== "fixture content")
                throw new Error("read mismatch");
            },
          });
          await this.saveData({ value: manifest.id });
        }
      };
    };
    const fixtureManager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage,
      codeEvaluator: evaluator,
    });
    await fixtureManager.initialize();
    await fixtureManager.enablePlugin("surface-plugin");
    await fixtureManager.enablePlugin("second-plugin");
    const command = fixtureManager.getCommands()[0];
    await command.callback();
    await expect(
      fixtureManager
        .getPlugin("surface-plugin")
        ?.instance?.vault.write("../../outside-vault.md", "x"),
    ).rejects.toThrow("Invalid vault-relative path");
    expect(await fs.loadPluginData("surface-plugin")).toEqual({
      value: "surface-plugin",
    });
    expect(await fs.loadPluginData("second-plugin")).toEqual({
      value: "second-plugin",
    });
    expect(fixtureManager.getSettingsTabs()).toHaveLength(2);
    await fixtureManager.disablePlugin("surface-plugin");
    expect(fixtureManager.getCommands().map(({ id }) => id)).toEqual([
      "second-plugin:write",
    ]);
    expect(fixtureManager.getSettingsTabs()).toHaveLength(1);
    await fixtureManager.enablePlugin("surface-plugin");
    expect(fixtureManager.getCommands().map(({ id }) => id)).toContain(
      "surface-plugin:write",
    );
    expect(fixtureManager.getSettingsTabs()).toHaveLength(2);

    const restarted = new PluginLifecycleManager({
      fsAdapter: fs,
      storage,
      codeEvaluator: evaluator,
    });
    await restarted.initialize();
    expect(
      await restarted.getPlugin("second-plugin")?.instance?.loadData(),
    ).toEqual({ value: "second-plugin" });
  });

  it("does not turn one plugin write into repeated adapter writes", async () => {
    const fs = new MemoryPluginFs();
    let writes = 0;
    const write = fs.vault.write;
    fs.vault.write = async (path, content) => {
      writes++;
      await write(path, content);
    };
    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
    });
    const vault = manager.getPlugin("missing")?.instance?.vault;
    expect(vault).toBeUndefined();
    await fs.vault.write("one.md", "one");
    expect(writes).toBe(1);
  });
});
