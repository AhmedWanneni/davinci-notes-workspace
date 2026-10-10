// @ts-nocheck -- Requires real runner-side plugin execution, deferred to 2b-2d.
import { describe, expect, it } from "vitest";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe.skip("plugin permission enforcement", () => {
  it("rejects undeclared calls, permits declared calls, and blocks escalation", async () => {
    const fs = new MemoryPluginFs();
    addPluginFixture(fs, "denied-plugin");
    addPluginFixture(fs, "writer-plugin", undefined, ["vault:write"]);
    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
    });
    await manager.initialize();
    await manager.enablePlugin("denied-plugin");
    await manager.enablePlugin("writer-plugin");

    const denied = manager.getPlugin("denied-plugin")!.instance!;
    const writer = manager.getPlugin("writer-plugin")!.instance!;
    await expect(denied.vault.write("denied.md", "x")).rejects.toThrow(
      'lacks permission "vault:write"',
    );
    expect(() =>
      denied.commands.register({
        id: "denied",
        name: "Denied",
        callback: () => {},
      }),
    ).toThrow('lacks permission "commands"');
    expect(() =>
      denied.workspace.registerView({
        id: "denied",
        name: "Denied",
        render: () => {},
      }),
    ).toThrow('lacks permission "ui:view"');
    expect(() => denied.settings.getTabs()).toThrow(
      'lacks permission "ui:view"',
    );
    expect(() => denied.editor.getContent()).toThrow(
      'lacks permission "editor:read"',
    );

    await writer.vault.write("allowed.md", "allowed");
    expect(await fs.vault.read("allowed.md")).toBe("allowed");
    await expect(writer.vault.write("../../outside.md", "x")).rejects.toThrow(
      "Invalid vault-relative path",
    );
    manager
      .getPlugin("writer-plugin")!
      .manifest.permissions!.push("vault:read");
    await expect(writer.vault.read("allowed.md")).rejects.toThrow(
      'lacks permission "vault:read"',
    );
  });

  it("removes permitted registrations when the plugin is disabled", async () => {
    const fs = new MemoryPluginFs();
    addPluginFixture(
      fs,
      "command-plugin",
      `module.exports = class extends DavinciPlugin {
      async onload() { this.commands.register({ id: "phase5", name: "Phase 5", callback: () => {} }); }
    };`,
      ["commands"],
    );
    const manager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
    });
    await manager.initialize();
    await manager.enablePlugin("command-plugin");
    expect(manager.getCommands().map(({ id }) => id)).toEqual(["phase5"]);
    await manager.disablePlugin("command-plugin");
    expect(manager.getCommands()).toEqual([]);
  });
});
