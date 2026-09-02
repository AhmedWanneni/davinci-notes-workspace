// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { DavinciPlugin, type PluginEditor } from "@app/plugin-api";
import { PluginLifecycleManager } from "./PluginLifecycleManager.js";
import {
  addPluginFixture,
  MemoryPluginFs,
  MemoryPluginStorage,
} from "./pluginTestFixtures.js";

describe("Phase 4 workspace and DOM fixture", () => {
  it("mounts a DOM-only view, cleans it on disable, and remounts cleanly", async () => {
    const fs = new MemoryPluginFs();
    addPluginFixture(fs, "ui-plugin", undefined, ["ui:view", "editor:read"]);
    let content = "current note";
    const listeners = new Set<(value: string) => void>();
    const editor: PluginEditor = {
      getContent: () => content,
      setContent: (value) => {
        content = value;
        listeners.forEach((listener) => listener(value));
      },
      getSelection: () => ({ from: content.length, to: content.length }),
      setSelection: () => {},
      insertText: (value) => {
        content += value;
        listeners.forEach((listener) => listener(content));
      },
      onContentChange: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    let observed = "";
    let readAtLoad = "";
    const evaluator = () =>
      class FixturePlugin extends DavinciPlugin {
        async onload() {
          readAtLoad = this.editor.getContent();
          this.editor.onContentChange((value) => {
            observed = value;
          });
          this.workspace.registerView({
            id: "fixture-view",
            name: "Fixture View",
            render: ({ container, dom }) => {
              const heading = dom.createEl("h2", {
                text: "Rendered by plugin DOM API",
              });
              container.append(heading);
              return () => container.replaceChildren();
            },
          });
        }
      };
    const realManager = new PluginLifecycleManager({
      fsAdapter: fs,
      storage: new MemoryPluginStorage(),
      codeEvaluator: evaluator,
    });
    realManager.setEditor(editor);
    await realManager.initialize();
    await realManager.enablePlugin("ui-plugin");
    expect(readAtLoad).toBe("current note");
    editor.insertText(" + edit");
    expect(content).toBe("current note + edit");
    expect(observed).toBe("current note + edit");
    expect(listeners).toHaveLength(1);
    const instance = realManager.getPlugin("ui-plugin")?.instance;
    const container = document.createElement("div");
    instance?.workspace.openLeaf("fixture-view");
    realManager.mountPluginView(container);
    expect(container.textContent).toBe("Rendered by plugin DOM API");
    expect(realManager.getOpenPluginViewId()).toBe("fixture-view");
    await realManager.disablePlugin("ui-plugin");
    expect(container.textContent).toBe("");
    expect(realManager.getOpenPluginViewId()).toBeNull();
    expect(listeners).toHaveLength(0);
    await realManager.enablePlugin("ui-plugin");
    const fresh = realManager.getPlugin("ui-plugin")?.instance;
    fresh?.workspace.openLeaf("fixture-view");
    realManager.mountPluginView(container);
    expect(container.textContent).toBe("Rendered by plugin DOM API");
    expect(realManager.getOpenPluginViewId()).toBe("fixture-view");
  });
});
