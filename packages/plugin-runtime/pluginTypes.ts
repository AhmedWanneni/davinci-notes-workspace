import type {
  DavinciPlugin,
  PluginContext,
  PluginData,
  PluginManifest,
  ValidationError,
} from "@app/plugin-api";
import type { PluginVaultAdapter } from "./pluginSurface.js";
import type { PluginRpcTransport } from "./pluginRpc.js";

export type PluginStatus = "disabled" | "enabled" | "error";

export interface PluginRecord {
  id: string;
  manifest: PluginManifest;
  dirName: string;
  status: PluginStatus;
  error?: string;
}

export interface PluginDiscoveryError {
  dirName: string;
  error: string;
  validationErrors?: ValidationError[];
}

export interface PluginFileSystemAdapter {
  vault: PluginVaultAdapter;
  /**
   * Lists the names of directories found inside the plugins root folder.
   * e.g. ["calendar-view", "vim-extras"]
   */
  listPluginDirectories: () => Promise<string[]>;

  /**
   * Reads a text file located within a specific plugin directory.
   * e.g. readPluginFile("calendar-view", "manifest.json")
   */
  readPluginFile: (dirName: string, relativePath: string) => Promise<string>;

  /**
   * Loads the host-owned settings file for a plugin.
   * Backed by .davinci/plugins/<plugin-id>/data.json on desktop.
   */
  loadPluginData: (dirName: string) => Promise<PluginData>;

  /**
   * Persists the host-owned settings file for a plugin.
   */
  savePluginData: (dirName: string, data: PluginData) => Promise<void>;
}

export interface PluginStateStorage {
  /**
   * Loads the persisted list of enabled plugin IDs from app settings/storage.
   */
  loadEnabledPluginIds: () => Promise<string[]>;

  /**
   * Persists the updated list of enabled plugin IDs.
   */
  saveEnabledPluginIds: (enabledIds: string[]) => Promise<void>;
}

export interface PluginManagerRpcOptions {
  rpc: PluginRpcTransport;
}

/** Retained for the evaluator export; the lifecycle manager no longer uses it. */
export type PluginConstructor = new (
  manifest: PluginManifest,
  context: PluginContext,
) => DavinciPlugin;
