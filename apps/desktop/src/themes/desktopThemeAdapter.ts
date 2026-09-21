import { getSetting, setSetting } from "../vault/settingsCommands";
import { getVaultIndexDb, withDbLock } from "../vault/sqliteIndex";
import { listThemeDirectories, readThemeFile } from "../vault/vaultCommands";
import type { ThemeFileSystemAdapter, ThemeStateStorage } from "./themeTypes";

export function createDesktopThemeFsAdapter(
  _vaultPath: string | null,
): ThemeFileSystemAdapter {
  return {
    async listThemeDirectories() {
      return listThemeDirectories();
    },
    async readThemeFile(dirName, relativePath) {
      return readThemeFile(dirName, relativePath);
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
