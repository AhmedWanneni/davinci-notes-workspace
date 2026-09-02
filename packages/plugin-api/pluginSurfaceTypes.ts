export type PluginData = Record<string, unknown>;

export interface PluginVault {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  list(folder?: string): Promise<string[]>;
  delete(path: string): Promise<void>;
}

export interface PluginCommand {
  id: string;
  name: string;
  hotkey?: string;
  callback: () => void | Promise<void>;
}

export interface PluginCommands {
  register(command: PluginCommand): () => void;
}

export type PluginSettingField =
  | {
      key: string;
      type: "text" | "number";
      label: string;
      defaultValue?: string | number;
    }
  | { key: string; type: "boolean"; label: string; defaultValue?: boolean };

export interface PluginSettingTab {
  id: string;
  title: string;
  fields: PluginSettingField[];
}

export interface PluginSettings {
  addTab(tab: PluginSettingTab): () => void;
  getTabs(): PluginSettingTab[];
}
