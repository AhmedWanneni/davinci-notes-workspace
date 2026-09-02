import type { PluginManifest } from "./manifestTypes.js";
import type {
  PluginCommands,
  PluginData,
  PluginSettings,
  PluginVault,
} from "./pluginSurfaceTypes.js";
import type { PluginEditor, PluginWorkspace } from "./pluginWorkspaceTypes.js";
export type {
  PluginCommand,
  PluginCommands,
  PluginData,
  PluginSettingField,
  PluginSettingTab,
  PluginSettings,
  PluginVault,
} from "./pluginSurfaceTypes.js";
export type {
  PluginDom,
  PluginEditor,
  PluginSelection,
  PluginView,
  PluginViewContext,
  PluginWorkspace,
} from "./pluginWorkspaceTypes.js";

export interface PluginContext {
  vault: PluginVault;
  commands: PluginCommands;
  settings: PluginSettings;
  workspace: PluginWorkspace;
  editor: PluginEditor;
  loadData: <T extends PluginData = PluginData>() => Promise<T>;
  saveData: (data: PluginData) => Promise<void>;
}

const emptyPluginContext: PluginContext = {
  vault: {
    async read(): Promise<string> {
      throw new Error("Vault API unavailable");
    },
    async write(): Promise<void> {
      throw new Error("Vault API unavailable");
    },
    async list(): Promise<string[]> {
      throw new Error("Vault API unavailable");
    },
    async delete(): Promise<void> {
      throw new Error("Vault API unavailable");
    },
  },
  commands: { register: () => () => {} },
  settings: { addTab: () => () => {}, getTabs: () => [] },
  workspace: {
    registerView: () => () => {},
    openLeaf: () => {},
    closeLeaf: () => {},
    focusLeaf: () => {},
    isViewOpen: () => false,
  },
  editor: {
    getContent: () => {
      throw new Error("Editor API unavailable");
    },
    setContent: () => {
      throw new Error("Editor API unavailable");
    },
    getSelection: () => {
      throw new Error("Editor API unavailable");
    },
    setSelection: () => {
      throw new Error("Editor API unavailable");
    },
    insertText: () => {
      throw new Error("Editor API unavailable");
    },
    onContentChange: () => () => {},
  },
  async loadData<T extends PluginData = PluginData>(): Promise<T> {
    return {} as T;
  },
  async saveData(_data: PluginData): Promise<void> {},
};

/**
 * Base class that all DaVinci Notes plugins extend.
 * Provides lifecycle hooks for activation and cleanup.
 */
export abstract class DavinciPlugin {
  readonly manifest: PluginManifest;
  protected readonly context: PluginContext;
  readonly vault: PluginVault;
  readonly commands: PluginCommands;
  readonly settings: PluginSettings;
  readonly workspace: PluginWorkspace;
  readonly editor: PluginEditor;

  constructor(
    manifest: PluginManifest,
    context: PluginContext = emptyPluginContext,
  ) {
    this.manifest = manifest;
    this.context = context;
    this.vault = context.vault;
    this.commands = context.commands;
    this.settings = context.settings;
    this.workspace = context.workspace;
    this.editor = context.editor;
  }

  /**
   * Called when the plugin is enabled and loaded into the application.
   * Plugins should perform initialization, register commands, or setup listeners here.
   */
  async onload(): Promise<void> {}

  /**
   * Called when the plugin is disabled or the host application is shutting down.
   * Plugins must clean up their resources, detach listeners, and unregister views here.
   */
  async onunload(): Promise<void> {}

  async loadData<T extends PluginData = PluginData>(): Promise<T> {
    return this.context.loadData<T>();
  }

  async saveData(data: PluginData): Promise<void> {
    await this.context.saveData(data);
  }
}
