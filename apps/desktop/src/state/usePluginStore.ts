import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  PluginLifecycleManager,
  PluginDiscoveryError,
  PluginRecord,
  PluginRpcTransport,
  RegisteredPluginCommand,
} from "@app/plugin-runtime";
import type { PluginSettingTab } from "@app/plugin-api";
import { createDesktopPluginFsAdapter } from "../vault/desktopPluginAdapter.js";

const pluginInitializations = new Map<string | null, Promise<void>>();
const pluginRuntimeLoads = new Map<string, Promise<void>>();

export interface PluginState {
  plugins: PluginRecord[];
  discoveryErrors: PluginDiscoveryError[];
  commands: RegisteredPluginCommand[];
  settingsTabs: PluginSettingTab[];
  openViewId: string | null;
  pluginViewRevision: number;
  pluginManager: PluginLifecycleManager | null;
  initPlugins: (vaultPath: string | null) => Promise<void>;
  loadPluginRuntime: (vaultPath: string | null) => Promise<void>;
  togglePlugin: (id: string, enable: boolean) => Promise<void>;
  invokePluginCommand: (id: string) => Promise<void>;
  pluginRpcHostCleanup: (() => Promise<void>) | null;
  pluginRpcTransport: PluginRpcTransport | null;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  discoveryErrors: [],
  commands: [],
  settingsTabs: [],
  openViewId: null,
  pluginViewRevision: 0,
  pluginManager: null,
  pluginRpcHostCleanup: null,
  pluginRpcTransport: null,

  initPlugins: (vaultPath: string | null) => {
    const existing = pluginInitializations.get(vaultPath);
    if (existing) return existing;
    const initialization = (async () => {
      const previousRpcCleanup = get().pluginRpcHostCleanup;
      if (previousRpcCleanup) await previousRpcCleanup();
      const prevManager = get().pluginManager;
      if (prevManager) {
        await prevManager.unloadAll();
      }

      set({
        plugins: [], discoveryErrors: [], commands: [], settingsTabs: [], openViewId: null,
        pluginViewRevision: 0, pluginManager: null, pluginRpcHostCleanup: null, pluginRpcTransport: null,
      });

      if (!vaultPath) return;

      const fsAdapter = createDesktopPluginFsAdapter(vaultPath);
      let hasPlugins: boolean;
      try {
        hasPlugins = (await fsAdapter.listPluginDirectories()).length > 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[plugin-discovery] failed to list .davinci/plugins", error);
        set({ discoveryErrors: [{ dirName: ".", error: `Failed to list plugin root directory: ${message}` }] });
        return;
      }
      if (hasPlugins) await invoke("ensure_plugin_webview");

      if (hasPlugins && (await invoke<boolean>("plugin_webview_exists"))) {
        const { listenForPluginHostRequests } = await import("../plugins/pluginRpcHost.js");
        const session = await listenForPluginHostRequests(vaultPath);
        set({ pluginRpcHostCleanup: session.cleanup, pluginRpcTransport: session });
        await invoke("start_plugin_webview_synthetic_probe");
      }

      if (hasPlugins) await get().loadPluginRuntime(vaultPath);
    })();
    pluginInitializations.set(vaultPath, initialization);
    return initialization.finally(() => {
      if (pluginInitializations.get(vaultPath) === initialization) {
        pluginInitializations.delete(vaultPath);
      }
    });
  },

  loadPluginRuntime: (vaultPath: string | null) => {
    if (!vaultPath || get().pluginManager) return Promise.resolve();
    const existing = pluginRuntimeLoads.get(vaultPath);
    if (existing) return existing;
    const load = (async () => {
      const { createPluginManager } = await import("../plugins/createPluginManager.js");
      if (get().pluginManager) return;

      const rpc = get().pluginRpcTransport;
      if (!rpc) throw new Error("Plugin runtime requires an active RPC session");
      const manager = createPluginManager(vaultPath, rpc);

      manager.onStateChange(() => {
        set((state) => ({
          plugins: manager.getPlugins(), discoveryErrors: manager.getDiscoveryErrors(), commands: manager.getCommands(),
          settingsTabs: manager.getSettingsTabs(), openViewId: manager.getOpenPluginViewId(),
          pluginViewRevision: state.pluginViewRevision + 1,
        }));
      });

      await manager.initialize();
      set({
        pluginManager: manager, plugins: manager.getPlugins(), discoveryErrors: manager.getDiscoveryErrors(),
        commands: manager.getCommands(), settingsTabs: manager.getSettingsTabs(), openViewId: manager.getOpenPluginViewId(),
        pluginViewRevision: get().pluginViewRevision + 1,
      });
    })();
    pluginRuntimeLoads.set(vaultPath, load);
    return load.finally(() => {
      if (pluginRuntimeLoads.get(vaultPath) === load) {
        pluginRuntimeLoads.delete(vaultPath);
      }
    });
  },

  togglePlugin: async (id: string, enable: boolean) => {
    const manager = get().pluginManager;
    if (!manager) return;

    if (enable) {
      await manager.enablePlugin(id);
    } else {
      await manager.disablePlugin(id);
    }
  },

  invokePluginCommand: async (id: string) => {
    await get().pluginManager?.invokeCommand(id);
  },
}));
