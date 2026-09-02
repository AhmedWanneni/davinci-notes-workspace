import type {
  PluginCommand,
  PluginCommands,
  PluginSettingTab,
  PluginSettings,
  PluginVault,
  PluginPermission,
} from "@app/plugin-api";
import { requirePluginPermission } from "./permissionGuard.js";

export interface PluginVaultAdapter {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  list(folder?: string): Promise<string[]>;
  delete(path: string): Promise<void>;
}

export interface RegisteredPluginCommand extends PluginCommand {
  pluginId: string;
}

function assertVaultPath(path: string): void {
  if (!path || path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)) {
    throw new Error(`Invalid vault-relative path: ${path}`);
  }
  const parts = path.replaceAll("\\", "/").split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Invalid vault-relative path: ${path}`);
  }
}

export function createPluginVault(
  adapter: PluginVaultAdapter,
  pluginId: string,
  permissions: readonly PluginPermission[],
): PluginVault {
  return {
    read: async (path) => {
      requirePluginPermission(pluginId, permissions, "vault.read");
      assertVaultPath(path);
      return adapter.read(path);
    },
    write: async (path, content) => {
      requirePluginPermission(pluginId, permissions, "vault.write");
      assertVaultPath(path);
      await adapter.write(path, content);
    },
    list: async (folder) => {
      requirePluginPermission(pluginId, permissions, "vault.list");
      if (folder !== undefined) assertVaultPath(folder);
      return adapter.list(folder);
    },
    delete: async (path) => {
      requirePluginPermission(pluginId, permissions, "vault.delete");
      assertVaultPath(path);
      await adapter.delete(path);
    },
  };
}

export class PluginCommandRegistry {
  private readonly commands = new Map<string, RegisteredPluginCommand>();

  createApi(
    pluginId: string,
    permissions: readonly PluginPermission[],
  ): PluginCommands {
    return {
      register: (command) => {
        requirePluginPermission(pluginId, permissions, "commands.register");
        if (this.commands.has(command.id))
          throw new Error(`Command already registered: ${command.id}`);
        this.commands.set(command.id, { ...command, pluginId });
        return () => {
          if (this.commands.get(command.id)?.pluginId === pluginId)
            this.commands.delete(command.id);
        };
      },
    };
  }

  removePlugin(pluginId: string): void {
    for (const [id, command] of this.commands)
      if (command.pluginId === pluginId) this.commands.delete(id);
  }

  getCommands(): RegisteredPluginCommand[] {
    return [...this.commands.values()];
  }
}

export class PluginSettingsRegistry {
  private readonly tabs = new Map<
    string,
    PluginSettingTab & { pluginId: string }
  >();

  createApi(
    pluginId: string,
    permissions: readonly PluginPermission[],
  ): PluginSettings {
    return {
      addTab: (tab) => {
        requirePluginPermission(pluginId, permissions, "settings.addTab");
        if (this.tabs.has(tab.id))
          throw new Error(`Settings tab already registered: ${tab.id}`);
        this.tabs.set(tab.id, { ...tab, pluginId });
        return () => {
          if (this.tabs.get(tab.id)?.pluginId === pluginId)
            this.tabs.delete(tab.id);
        };
      },
      getTabs: () => {
        requirePluginPermission(pluginId, permissions, "settings.addTab");
        return [...this.tabs.values()].map(
          ({ pluginId: _pluginId, ...tab }) => tab,
        );
      },
    };
  }

  removePlugin(pluginId: string): void {
    for (const [id, tab] of this.tabs)
      if (tab.pluginId === pluginId) this.tabs.delete(id);
  }

  getTabs(): PluginSettingTab[] {
    return [...this.tabs.values()].map(
      ({ pluginId: _pluginId, ...tab }) => tab,
    );
  }
}
