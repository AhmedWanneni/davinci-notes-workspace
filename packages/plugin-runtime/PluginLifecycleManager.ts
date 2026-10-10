import { discoverPlugins } from "./discoverPlugins.js";
import type {
  PluginDiscoveryError,
  PluginFileSystemAdapter,
  PluginRecord,
  PluginStateStorage,
} from "./pluginTypes.js";
import type { PluginEditorHostAdapter, PluginRpcTransport } from "./pluginRpc.js";
import { isPluginLoadResult } from "./pluginRpc.js";
import { PluginViewRegistry, type RegisteredPluginView } from "./pluginViewRegistry.js";
import {
  PluginCommandRegistry,
  RegisteredPluginCommand,
} from "./pluginSurface.js";

export interface PluginManagerOptions {
  fsAdapter: PluginFileSystemAdapter;
  storage: PluginStateStorage;
  rpc: PluginRpcTransport;
}

export class PluginLifecycleManager {
  private readonly fsAdapter: PluginFileSystemAdapter;
  private readonly storage: PluginStateStorage;
  private readonly rpc: PluginRpcTransport;
  private plugins: Map<string, PluginRecord> = new Map();
  private discoveryErrors: PluginDiscoveryError[] = [];
  private listeners: Set<() => void> = new Set();
  private readonly commandRegistry = new PluginCommandRegistry();
  private readonly viewRegistry = new PluginViewRegistry();
  private readonly enableOperations = new Map<string, Promise<boolean>>();

  constructor(options: PluginManagerOptions) {
    this.fsAdapter = options.fsAdapter;
    this.storage = options.storage;
    this.rpc = options.rpc;
  }

  async initialize(): Promise<void> {
    const discovery = await discoverPlugins(this.fsAdapter);
    this.plugins = discovery.plugins;
    this.discoveryErrors = discovery.discoveryErrors;
    let enabledIds: string[] = [];
    try {
      enabledIds = await this.storage.loadEnabledPluginIds();
    } catch (error) {
      console.error("[PluginLifecycleManager] Failed to load enabled IDs:", error);
    }
    for (const id of enabledIds) {
      if (this.plugins.has(id)) await this.enablePlugin(id, false);
    }
    this.notify();
  }

  getPlugins(): PluginRecord[] { return Array.from(this.plugins.values()); }
  getPlugin(id: string): PluginRecord | undefined { return this.plugins.get(id); }
  getDiscoveryErrors(): PluginDiscoveryError[] { return [...this.discoveryErrors]; }
  getCommands(): RegisteredPluginCommand[] { return this.commandRegistry.getCommands(); }
  getSettingsTabs() { return []; }
  getOpenPluginViewId(): string | null { return this.viewRegistry.getOpenViewId(); }
  getPluginView(viewId: string): RegisteredPluginView | undefined { return this.viewRegistry.get(viewId); }
  async dispatchPluginViewEvent(viewId: string, event: import("@app/plugin-api").PluginViewEvent): Promise<void> {
    const view = this.viewRegistry.get(viewId);
    if (!view) throw new Error(`Unknown plugin view: ${viewId}`);
    const result = await this.rpc.request("views.event", { id: view.pluginId, viewId, event });
    this.viewRegistry.update(view.pluginId, viewId, (result as { model?: unknown })?.model);
    this.notify();
  }
  closePluginView(): void { this.viewRegistry.close(); this.notify(); }
  setEditor(editor: PluginEditorHostAdapter | null): void { this.rpc.setEditor?.(editor); }

  async enablePlugin(id: string, persist = true): Promise<boolean> {
    const record = this.plugins.get(id);
    if (!record) return false;
    if (record.status === "enabled") return true;
    const existingOperation = this.enableOperations.get(id);
    if (existingOperation) return existingOperation;
    const operation = this.enablePluginOnce(record, persist);
    this.enableOperations.set(id, operation);
    try {
      return await operation;
    } finally {
      this.enableOperations.delete(id);
    }
  }

  private async enablePluginOnce(record: PluginRecord, persist: boolean): Promise<boolean> {
    const capabilityToken = this.rpc.registerPlugin?.(
      record.id,
      record.manifest.permissions ?? [],
    ) ?? "";
    try {
      const source = await this.fsAdapter.readPluginFile(record.dirName, record.manifest.main);
      const result = await this.rpc.request("plugins.load", {
        id: record.id,
        manifest: record.manifest,
        source,
        dirName: record.dirName,
        capabilityToken,
      });
      this.registerRunnerCommands(record.id, result);
      const onloadResult = await this.rpc.request("plugins.onload", { id: record.id });
      this.registerRunnerCommands(record.id, onloadResult);
      this.viewRegistry.replacePluginViews(record.id, onloadResult);
      record.status = "enabled";
      record.error = undefined;
    } catch (error) {
      this.rpc.unregisterPlugin?.(record.id);
      record.status = "error";
      record.error = error instanceof Error ? error.message : String(error);
      this.commandRegistry.removePlugin(record.id);
      this.notify();
      return false;
    }
    if (persist) await this.persistEnabledState();
    this.notify();
    return true;
  }

  async disablePlugin(id: string, persist = true): Promise<boolean> {
    const record = this.plugins.get(id);
    if (!record || record.status !== "enabled") return false;
    try {
      await this.rpc.request("plugins.onunload", { id: record.id });
    } catch (error) {
      console.error(`[PluginLifecycleManager] onunload failed for ${id}:`, error);
    }
    this.commandRegistry.removePlugin(id);
    this.rpc.removePlugin?.(id);
    this.rpc.unregisterPlugin?.(id);
    this.viewRegistry.removePlugin(id);
    record.status = "disabled";
    record.error = undefined;
    if (persist) await this.persistEnabledState();
    this.notify();
    return true;
  }

  async invokeCommand(id: string): Promise<void> {
    const command = this.commandRegistry.getCommands().find((item) => item.id === id);
    if (!command) throw new Error(`Unknown plugin command: ${id}`);
    const result = await this.rpc.request("commands.invoke", {
      id: command.pluginId,
      commandId: command.id,
    });
    this.viewRegistry.replacePluginViews(command.pluginId, result);
    this.notify();
  }

  async unloadAll(): Promise<void> {
    const enabled = Array.from(this.plugins.values()).filter((item) => item.status === "enabled");
    for (let i = enabled.length - 1; i >= 0; i--) await this.disablePlugin(enabled[i].id, false);
  }

  onStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private registerRunnerCommands(pluginId: string, result: unknown): void {
    if (!isPluginLoadResult(result)) {
      throw new Error("plugins.load returned an invalid command descriptor payload");
    }
    const commands = result.commands ?? [];
    for (const command of commands) {
      if (typeof command?.id !== "string" || typeof command.title !== "string") continue;
      this.commandRegistry.registerDescriptor({ ...command, pluginId });
    }
  }

  private async persistEnabledState(): Promise<void> {
    const enabledIds = Array.from(this.plugins.values())
      .filter((item) => item.status === "enabled")
      .map((item) => item.id);
    try { await this.storage.saveEnabledPluginIds(enabledIds); } catch (error) {
      console.error("[PluginLifecycleManager] Failed to persist enabled IDs:", error);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try { listener(); } catch (error) { console.error("[PluginLifecycleManager] State listener failed:", error); }
    }
  }
}
