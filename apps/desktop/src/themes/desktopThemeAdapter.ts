import { exists, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { getSetting, setSetting } from "../vault/settingsCommands";
import { getVaultIndexDb, withDbLock } from "../vault/sqliteIndex";
import type { ThemeFileSystemAdapter, ThemeStateStorage } from "./themeTypes";

export function createDesktopThemeFsAdapter(
  vaultPath: string | null,
): ThemeFileSystemAdapter {
  return {
    async listThemeDirectories() {
      if (!vaultPath) return [];
      const themesPath = `${vaultPath}/.davinci/themes`;
      if (!(await exists(themesPath))) return [];
      return (await readDir(themesPath))
        .filter((entry) => entry.isDirectory)
        .map((entry) => entry.name);
    },
    async readThemeFile(dirName, relativePath) {
      if (!vaultPath) throw new Error("No vault open");
      return readTextFile(
        `${vaultPath}/.davinci/themes/${dirName}/${relativePath}`,
      );
    },
  };
}

export function createDesktopThemeStorage(): ThemeStateStorage {
  return {
    async loadActiveThemeId() {
      try {
        const db = await getVaultIndexDb();
        return await withDbLock(
          async () => (await getSetting(db, "activeThemeId")) || null,
        );
      } catch (error) {
        console.warn("Failed to load active theme:", error);
        return null;
      }
    },
    async saveActiveThemeId(themeId) {
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() => setSetting(db, "activeThemeId", themeId ?? ""));
      } catch (error) {
        console.error("Failed to save active theme:", error);
      }
    },
  };
}
