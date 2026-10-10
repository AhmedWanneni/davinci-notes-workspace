import { describe, expect, it } from "vitest";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import type { PluginRpcTransport } from "./pluginRpc.js";
import { addPluginFixture, MemoryPluginFs, MemoryPluginStorage } from "./pluginTestFixtures.js";

describe("plugin lifecycle RPC", () => {
  it("keeps only descriptors and dispatches lifecycle and commands over RPC", async () => {
    const calls: Array<{ method: string; params?: unknown }> = [];
    const rpc: PluginRpcTransport = {
      async request(method, params) {
        calls.push({ method, params });
        if (method === "plugins.load") {
          return { commands: [{ id: "fixture:run", title: "Run fixture" }] };
        }
        if (method === "plugins.onload") {
          return { views: [{ id: "fixture:view", name: "Fixture", open: true, model: { type: "text", text: "Before" } }] };
        }
        if (method === "views.event") return { model: { type: "text", text: "After" } };
        return { ok: true };
      },
    };
    const fs = new MemoryPluginFs();
    addPluginFixture(fs, "fixture");
    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
      rpc,
    });

    await manager.initialize();
    await manager.enablePlugin("fixture");
    await manager.invokeCommand("fixture:run");
    await manager.dispatchPluginViewEvent("fixture:view", { type: "click", targetId: "button" });
    await manager.disablePlugin("fixture");

    expect(manager.getPlugin("fixture")).toMatchObject({
      id: "fixture",
      status: "disabled",
    });
    expect(manager.getCommands()).toEqual([]);
    expect(manager.getPluginView("fixture:view")).toBeUndefined();
    expect(calls.map((call) => call.method)).toEqual([
      "plugins.load",
      "plugins.onload",
      "commands.invoke",
      "views.event",
      "plugins.onunload",
    ]);
  });

  it("coalesces overlapping enable requests into one lifecycle operation", async () => {
    const calls: string[] = [];
    let releaseLoad: (() => void) | undefined;
    const loadStarted = new Promise<void>((resolve) => { releaseLoad = resolve; });
    const rpc: PluginRpcTransport = {
      async request(method) {
        calls.push(method);
        if (method === "plugins.load") {
          await loadStarted;
          return { commands: [] };
        }
        if (method === "plugins.onload") return { commands: [], views: [] };
        return { ok: true };
      },
    };
    const fs = new MemoryPluginFs();
    addPluginFixture(fs, "fixture");
    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
      rpc,
    });
    await manager.initialize();

    const first = manager.enablePlugin("fixture");
    const second = manager.enablePlugin("fixture");
    releaseLoad?.();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(calls).toEqual(["plugins.load", "plugins.onload"]);
  });
});
