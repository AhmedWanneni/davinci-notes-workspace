// @ts-nocheck -- Requires real runner-side plugin execution, deferred to 2b-2d.
import { describe, expect, it } from "vitest";
import { DavinciPlugin } from "@app/plugin-api";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe.skip("plugin data persistence", () => {
  it("passes host-backed data.json access through the base plugin API", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();
    addPluginFixture(fs, "settings-plugin", "// mock entry");

    const codeEvaluator = () => {
      return class SettingsPlugin extends DavinciPlugin {
        async onload() {
          const data = await this.loadData<{ launches?: number }>();
          await this.saveData({ launches: (data.launches ?? 0) + 1 });
        }
      };
    };

    const manager1 = new PluginLifecycleManager({
      fsAdapter: fs,
      storage,
      codeEvaluator,
    });
    await manager1.initialize();
    await manager1.enablePlugin("settings-plugin");
    expect(await fs.loadPluginData("settings-plugin")).toEqual({ launches: 1 });

    const manager2 = new PluginLifecycleManager({
      fsAdapter: fs,
      storage,
      codeEvaluator,
    });
    await manager2.initialize();
    expect(await fs.loadPluginData("settings-plugin")).toEqual({ launches: 2 });
  });
});
