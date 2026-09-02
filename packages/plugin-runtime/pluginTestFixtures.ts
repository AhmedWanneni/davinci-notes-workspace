import type { PluginData, PluginPermission } from "@app/plugin-api";
import type {
  PluginFileSystemAdapter,
  PluginStateStorage,
} from "./pluginTypes.js";
import type { PluginVaultAdapter } from "./pluginSurface.js";

export class MemoryPluginFs implements PluginFileSystemAdapter {
  private files: Map<string, string> = new Map();
  private data: Map<string, PluginData> = new Map();
  readonly vault: PluginVaultAdapter = {
    read: async (path) =>
      this.files.get(`vault/${path}`) ??
      (() => {
        throw new Error(`File not found: ${path}`);
      })(),
    write: async (path, content) => {
      this.files.set(`vault/${path}`, content);
    },
    list: async (folder) =>
      [...this.files.keys()]
        .filter(
          (key) =>
            key.startsWith("vault/") &&
            (!folder || key.startsWith(`vault/${folder}/`)),
        )
        .map((key) => key.slice(6)),
    delete: async (path) => {
      this.files.delete(`vault/${path}`);
    },
  };

  setFile(dirName: string, relativePath: string, content: string): void {
    this.files.set(`${dirName}/${relativePath}`, content);
  }

  async listPluginDirectories(): Promise<string[]> {
    const dirs = new Set<string>();
    for (const key of this.files.keys()) {
      const parts = key.split("/");
      if (parts.length > 1) {
        dirs.add(parts[0]);
      }
    }
    return Array.from(dirs);
  }

  async readPluginFile(dirName: string, relativePath: string): Promise<string> {
    const key = `${dirName}/${relativePath}`;
    const content = this.files.get(key);
    if (content === undefined) {
      throw new Error(`File not found: ${key}`);
    }
    return content;
  }

  async loadPluginData(dirName: string): Promise<PluginData> {
    return { ...(this.data.get(dirName) ?? {}) };
  }

  async savePluginData(dirName: string, data: PluginData): Promise<void> {
    this.data.set(dirName, { ...data });
  }
}

export class MemoryPluginStorage implements PluginStateStorage {
  private enabled: string[] = [];

  async loadEnabledPluginIds(): Promise<string[]> {
    return [...this.enabled];
  }

  async saveEnabledPluginIds(enabledIds: string[]): Promise<void> {
    this.enabled = [...enabledIds];
  }
}

export function addPluginFixture(
  fs: MemoryPluginFs,
  id: string,
  code = "module.exports = class extends DavinciPlugin {};",
  permissions?: PluginPermission[],
): void {
  fs.setFile(
    id,
    "manifest.json",
    JSON.stringify({
      id,
      name: id,
      version: "1.0.0",
      minAppVersion: "0.1.0",
      description: `${id} fixture`,
      author: "Tester",
      main: "main.js",
      ...(permissions ? { permissions } : {}),
    }),
  );
  fs.setFile(id, "main.js", code);
}
