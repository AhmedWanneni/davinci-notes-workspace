export type PluginData = Record<string, unknown>;

export interface PluginVault {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  list(folder?: string): Promise<string[]>;
  delete(path: string): Promise<void>;
}

/** Serializable request options for the mediated plugin network API. */
export interface PluginNetworkRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** A bounded, serializable network response returned by the host. */
export interface PluginNetworkResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export interface PluginNetwork {
  fetch(url: string, request?: PluginNetworkRequest): Promise<PluginNetworkResponse>;
}

export interface PluginCommand {
  id: string;
  title: string;
  hotkey?: string;
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
