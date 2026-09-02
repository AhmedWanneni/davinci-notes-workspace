import { create } from "zustand";
import {
  PluginLifecycleManager,
  type PluginRecord,
  type RegisteredPluginCommand,
} from "@app/plugin-runtime";
import type { PluginSettingTab } from "@app/plugin-api";
import {
  createDesktopPluginFsAdapter,
  createDesktopPluginStorage,
} from "../vault/desktopPluginAdapter.js";

export interface PluginState {
  plugins: PluginRecord[];
  commands: RegisteredPluginCommand[];
  settingsTabs: PluginSettingTab[];
  openViewId: string | null;
  pluginManager: PluginLifecycleManager | null;
  initPlugins: (vaultPath: string | null) => Promise<void>;
  togglePlugin: (id: string, enable: boolean) => Promise<void>;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  commands: [],
  settingsTabs: [],
  openViewId: null,
  pluginManager: null,

  initPlugins: async (vaultPath: string | null) => {
    const prevManager = get().pluginManager;
    if (prevManager) {
      await prevManager.unloadAll();
    }

    if (!vaultPath) {
      set({
        plugins: [],
        commands: [],
        settingsTabs: [],
        openViewId: null,
        pluginManager: null,
      });
      return;
    }

    const fsAdapter = createDesktopPluginFsAdapter(vaultPath);
    const storage = createDesktopPluginStorage();
    const manager = new PluginLifecycleManager({ fsAdapter, storage });

    manager.onStateChange(() => {
      set({
        plugins: manager.getPlugins(),
        commands: manager.getCommands(),
        settingsTabs: manager.getSettingsTabs(),
        openViewId: manager.getOpenPluginViewId(),
      });
    });

    await manager.initialize();
    set({
      pluginManager: manager,
      plugins: manager.getPlugins(),
      commands: manager.getCommands(),
      settingsTabs: manager.getSettingsTabs(),
      openViewId: manager.getOpenPluginViewId(),
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
}));
