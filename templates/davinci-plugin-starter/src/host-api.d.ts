interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
  main: string;
  permissions?: string[];
}

interface PluginVault {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
}
interface PluginNetworkResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}
interface PluginNetwork {
  fetch(url: string, request?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<PluginNetworkResponse>;
}

interface PluginCommands {
  register(command: {
    id: string;
    name: string;
    callback: () => void | Promise<void>;
  }): () => void;
}

interface PluginSelection { from: number; to: number; }
interface PluginEditorSnapshot {
  content: string;
  selection: PluginSelection;
  version: number;
}
interface PluginEditor {
  getContent(): Promise<PluginEditorSnapshot>;
  getSelection(): Promise<PluginEditorSnapshot>;
  setContent(content: string, expectedVersion?: number): Promise<PluginEditorSnapshot>;
  insertText(text: string, expectedVersion?: number): Promise<PluginEditorSnapshot>;
  subscribe(listener: (snapshot: PluginEditorSnapshot) => void): Promise<() => void>;
}
type PluginViewModel =
  | { type: "stack"; children: PluginViewModel[] }
  | { type: "text"; text: string }
  | { type: "button"; id: string; label: string; disabled?: boolean };
interface PluginView {
  id: string;
  name: string;
  render(): PluginViewModel;
  onEvent?(event: { type: "click"; targetId: string }): void | PluginViewModel | Promise<void | PluginViewModel>;
}
interface PluginWorkspace {
  registerView(view: PluginView): () => void;
  openLeaf(viewId: string): void;
}

interface PluginContext {
  vault: PluginVault;
  net: PluginNetwork;
  commands: PluginCommands;
  workspace: PluginWorkspace;
  editor: PluginEditor;
}

type PluginData = Record<string, unknown> | null;

declare abstract class DavinciPlugin {
  readonly manifest: PluginManifest;
  readonly vault: PluginVault;
  readonly net: PluginNetwork;
  readonly commands: PluginCommands;
  readonly workspace: PluginWorkspace;
  readonly editor: PluginEditor;
  constructor(manifest: PluginManifest, context: PluginContext);
  loadData(): Promise<PluginData>;
  saveData(data: PluginData): Promise<void>;
  onload(): Promise<void>;
  onunload(): Promise<void>;
}

declare const module: { exports: unknown };
