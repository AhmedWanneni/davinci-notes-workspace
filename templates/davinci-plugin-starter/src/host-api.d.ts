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

interface PluginCommands {
  register(command: {
    id: string;
    name: string;
    callback: () => void | Promise<void>;
  }): () => void;
}

interface PluginContext {
  vault: PluginVault;
  commands: PluginCommands;
}

declare abstract class DavinciPlugin {
  readonly manifest: PluginManifest;
  readonly vault: PluginVault;
  readonly commands: PluginCommands;
  constructor(manifest: PluginManifest, context: PluginContext);
  onload(): Promise<void>;
  onunload(): Promise<void>;
}

declare const module: { exports: unknown };
