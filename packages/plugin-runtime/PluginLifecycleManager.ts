import { type PluginContext, type PluginEditor } from "@app/plugin-api";
import { discoverPlugins } from "./discoverPlugins.js";
import { evaluatePluginModule } from "./evaluatePluginModule.js";
import type {
  PluginDiscoveryError,
  PluginFileSystemAdapter,
  PluginConstructor,
  PluginRecord,
  PluginStateStorage,
} from "./pluginTypes.js";
import {
  PluginCommandRegistry,
  PluginSettingsRegistry,
  createPluginVault,
} from "./pluginSurface.js";
import { PluginEditorHost } from "./pluginEditor.js";
import { PluginWorkspaceHost } from "./pluginWorkspace.js";

export interface PluginManagerOptions {
  fsAdapter: PluginFileSystemAdapter;
  storage: PluginStateStorage;
  codeEvaluator?: (
    code: string,
    manifest: PluginRecord["manifest"],
  ) => PluginConstructor;
}

export class PluginLifecycleManager {
  private readonly fsAdapter: PluginFileSystemAdapter;
  private readonly storage: PluginStateStorage;
  private readonly codeEvaluator: NonNullable<
    PluginManagerOptions["codeEvaluator"]
  >;

  private plugins: Map<string, PluginRecord> = new Map();
  private discoveryErrors: PluginDiscoveryError[] = [];
  private listeners: Set<() => void> = new Set();
  private readonly commandRegistry = new PluginCommandRegistry();
  private readonly settingsRegistry = new PluginSettingsRegistry();
  private readonly editorHost = new PluginEditorHost();
  private readonly workspaceHost: PluginWorkspaceHost;

  constructor(options: PluginManagerOptions) {
    this.fsAdapter = options.fsAdapter;
    this.storage = options.storage;
    this.codeEvaluator = options.codeEvaluator ?? evaluatePluginModule;
    this.workspaceHost = new PluginWorkspaceHost(() => this.notify());
  }

  async initialize(): Promise<void> {
    const discovery = await discoverPlugins(this.fsAdapter);
    this.plugins = discovery.plugins;
    this.discoveryErrors = discovery.discoveryErrors;

    let enabledIds: string[] = [];
    try {
      enabledIds = await this.storage.loadEnabledPluginIds();
    } catch (err) {
      console.error(
        "[PluginLifecycleManager] Failed to load enabled plugin IDs:",
        err,
      );
    }

    const enabledSet = new Set(enabledIds);

    for (const id of enabledSet) {
      if (this.plugins.has(id)) {
        await this.enablePlugin(id, false);
      }
    }

    this.notify();
  }

  getPlugins(): PluginRecord[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): PluginRecord | undefined {
    return this.plugins.get(id);
  }

  getDiscoveryErrors(): PluginDiscoveryError[] {
    return [...this.discoveryErrors];
  }

  getCommands() {
    return this.commandRegistry.getCommands();
  }

  getSettingsTabs() {
    return this.settingsRegistry.getTabs();
  }

  getOpenPluginViewId(): string | null {
    return this.workspaceHost.getOpenViewId();
  }

  mountPluginView(container: HTMLElement): void {
    this.workspaceHost.mount(container);
  }

  closePluginView(): void {
    this.workspaceHost.closeLeaf();
  }

  setEditor(editor: PluginEditor | null): void {
    this.editorHost.setEditor(editor);
  }

  async enablePlugin(id: string, persist = true): Promise<boolean> {
    const record = this.plugins.get(id);
    if (!record) {
      console.warn(
        `[PluginLifecycleManager] Cannot enable unknown plugin "${id}".`,
      );
      return false;
    }

    if (record.status === "enabled" && record.instance) {
      return true;
    }

    let code = "";
    try {
      code = await this.fsAdapter.readPluginFile(
        record.dirName,
        record.manifest.main,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      record.status = "error";
      record.error = `Could not read entry file "${record.manifest.main}": ${message}`;
      this.notify();
      return false;
    }

    let PluginClass: PluginConstructor;
    try {
      PluginClass = this.codeEvaluator(code, record.manifest);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      record.status = "error";
      record.error = message;
      this.notify();
      return false;
    }

    const instance = new PluginClass(
      record.manifest,
      this.createPluginContext(record),
    );

    try {
      await instance.onload();
      record.status = "enabled";
      record.instance = instance;
      record.error = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      record.status = "error";
      record.instance = null;
      record.error = `onload() failed: ${message}`;
      console.error(
        `[PluginLifecycleManager] Plugin "${id}" threw in onload():`,
        err,
      );
      this.notify();
      return false;
    }

    if (persist) {
      await this.persistEnabledState();
    }

    this.notify();
    return true;
  }

  async disablePlugin(id: string, persist = true): Promise<boolean> {
    const record = this.plugins.get(id);
    if (!record || record.status !== "enabled") {
      return false;
    }

    if (record.instance) {
      try {
        await record.instance.onunload();
      } catch (err) {
        console.error(
          `[PluginLifecycleManager] Plugin "${id}" threw in onunload():`,
          err,
        );
      }
    }

    record.instance = null;
    this.commandRegistry.removePlugin(id);
    this.settingsRegistry.removePlugin(id);
    this.editorHost.removePlugin(id);
    this.workspaceHost.removePlugin(id);
    record.status = "disabled";
    record.error = undefined;

    if (persist) {
      await this.persistEnabledState();
    }

    this.notify();
    return true;
  }

  async unloadAll(): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values()).filter(
      (p) => p.status === "enabled",
    );

    // Unload in reverse order of activation
    for (let i = enabledPlugins.length - 1; i >= 0; i--) {
      await this.disablePlugin(enabledPlugins[i].id, false);
    }
  }

  onStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error(
          "[PluginLifecycleManager] Error in change listener:",
          err,
        );
      }
    }
  }

  private createPluginContext(record: PluginRecord): PluginContext {
    const permissions = [...(record.manifest.permissions ?? [])];
    return {
      vault: createPluginVault(this.fsAdapter.vault, record.id, permissions),
      commands: this.commandRegistry.createApi(record.id, permissions),
      settings: this.settingsRegistry.createApi(record.id, permissions),
      workspace: this.workspaceHost.createApi(record.id, permissions),
      editor: this.editorHost.createApi(record.id, permissions),
      loadData: async <T>() =>
        (await this.fsAdapter.loadPluginData(record.dirName)) as T,
      saveData: async (data) => {
        await this.fsAdapter.savePluginData(record.dirName, data);
      },
    };
  }

  private async persistEnabledState(): Promise<void> {
    const enabledIds = Array.from(this.plugins.values())
      .filter((p) => p.status === "enabled")
      .map((p) => p.id);

    try {
      await this.storage.saveEnabledPluginIds(enabledIds);
    } catch (err) {
      console.error(
        "[PluginLifecycleManager] Failed to persist enabled plugin IDs:",
        err,
      );
    }
  }
}
