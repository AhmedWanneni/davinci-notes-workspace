import { describe, expect, it } from "vitest";
import { DavinciPlugin } from "@app/plugin-api";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe("plugin lifecycle", () => {
  it("surfaces onload errors without affecting other plugins", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();

    addPluginFixture(
      fs,
      "crasher",
      `module.exports = class CrasherPlugin extends DavinciPlugin {
        async onload() {
          throw new Error("Fatal onload initialization failure");
        }
      };`,
    );
    addPluginFixture(fs, "good-plugin");

    const manager = new PluginLifecycleManager({ fsAdapter: fs, storage });
    await manager.initialize();

    expect(await manager.enablePlugin("crasher")).toBe(false);
    expect(manager.getPlugin("crasher")?.status).toBe("error");
    expect(manager.getPlugin("crasher")?.instance).toBeNull();
    expect(manager.getPlugin("crasher")?.error).toContain("onload() failed");

    expect(await manager.enablePlugin("good-plugin")).toBe(true);
    expect(manager.getPlugin("good-plugin")?.status).toBe("enabled");
  });

  it("executes onunload and re-enables with a fresh instance", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();
    const executionHistory: string[] = [];

    addPluginFixture(fs, "cycle-plugin", "// mock entry");

    const codeEvaluator = () => {
      return class CyclePlugin extends DavinciPlugin {
        async onload() {
          executionHistory.push("onload");
        }

        async onunload() {
          executionHistory.push("onunload");
        }
      };
    };

    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage,
      codeEvaluator,
    });
    await manager.initialize();

    await manager.enablePlugin("cycle-plugin");
    await manager.disablePlugin("cycle-plugin");
    await manager.enablePlugin("cycle-plugin");

    expect(manager.getPlugin("cycle-plugin")?.status).toBe("enabled");
    expect(executionHistory).toEqual(["onload", "onunload", "onload"]);
  });

  it("persists enabled state and restores only enabled plugins", async () => {
    const fs = new MemoryPluginFs();
    const storage = new MemoryPluginStorage();
    addPluginFixture(fs, "plugin-1");
    addPluginFixture(fs, "plugin-2");

    const manager1 = new PluginLifecycleManager({ fsAdapter: fs, storage });
    await manager1.initialize();
    await manager1.enablePlugin("plugin-1");

    expect(await storage.loadEnabledPluginIds()).toEqual(["plugin-1"]);

    const manager2 = new PluginLifecycleManager({ fsAdapter: fs, storage });
    await manager2.initialize();

    expect(manager2.getPlugin("plugin-1")?.status).toBe("enabled");
    expect(manager2.getPlugin("plugin-1")?.instance).not.toBeNull();
    expect(manager2.getPlugin("plugin-2")?.status).toBe("disabled");
    expect(manager2.getPlugin("plugin-2")?.instance).toBeNull();
  });
});
