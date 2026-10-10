import {
  deleteNote,
  listNotes,
  listPluginDirectories,
  readNote,
  readPluginFile,
  writeNote,
  writePluginFile,
} from "./vaultCommands";
import type { PluginData } from "@app/plugin-api";
import type {
  PluginFileSystemAdapter,
  PluginStateStorage,
} from "@app/plugin-runtime";
import { getSetting, setSetting } from "./settingsCommands";
import { getVaultIndexDb, withDbLock } from "./sqliteIndex";

export function createDesktopPluginFsAdapter(
  vaultPath: string | null,
): PluginFileSystemAdapter {
  return {
    vault: {
      async read(path) {
        return (await readNote(path)).content;
      },
      async write(path, content) {
        await writeNote(path, content);
      },
      async list(folder) {
        const paths = await listNotes();
        return folder
          ? paths.filter((path) => path.startsWith(`${folder}/`))
          : paths;
      },
      async delete(path) {
        await deleteNote(path);
      },
    },
    async listPluginDirectories(): Promise<string[]> {
      if (!vaultPath) return [];
      return listPluginDirectories();
    },

    async readPluginFile(
      dirName: string,
      relativePath: string,
    ): Promise<string> {
      if (!vaultPath) throw new Error("No vault open");
      return readPluginFile(dirName, relativePath);
    },

    async loadPluginData(dirName: string): Promise<PluginData> {
      if (!vaultPath) throw new Error("No vault open");
      try {
        const raw = await readPluginFile(dirName, "data.json");
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as PluginData)
          : {};
      } catch {
        return {};
      }
    },

    async savePluginData(dirName: string, data: PluginData): Promise<void> {
      if (!vaultPath) throw new Error("No vault open");
      await writePluginFile(dirName, "data.json", `${JSON.stringify(data, null, 2)}\n`);
    },
  };
}

export function createDesktopPluginStorage(): PluginStateStorage {
  return {
    async loadEnabledPluginIds(): Promise<string[]> {
      try {
        const db = await getVaultIndexDb();
        const raw = await withDbLock(() => getSetting(db, "enabledPlugins"));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === "string")
          : [];
      } catch (err) {
        console.warn("Failed to load enabled plugins setting:", err);
        return [];
      }
    },

    async saveEnabledPluginIds(enabledIds: string[]): Promise<void> {
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          setSetting(db, "enabledPlugins", JSON.stringify(enabledIds)),
        );
      } catch (err) {
        console.error("Failed to save enabled plugins setting:", err);
      }
    },
  };
}
