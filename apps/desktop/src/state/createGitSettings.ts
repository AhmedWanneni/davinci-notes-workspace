import { getSetting, getVaultIndexDb, setSetting } from "../vault";
import { withDbLock } from "../vault/sqliteIndex";

export interface GitSettingsState {
  gitEnabled: boolean;
  loadGitSettings: () => Promise<void>;
  setGitEnabled: (enabled: boolean) => Promise<void>;
}

export type SetGitSettings = (state: Partial<GitSettingsState>) => void;

export function createGitSettings(set: SetGitSettings): GitSettingsState {
  return {
    gitEnabled: false,

    loadGitSettings: async () => {
      try {
        const db = await getVaultIndexDb();
        const value = await withDbLock(() => getSetting(db, "git.enabled"));
        set({ gitEnabled: value === "true" });
      } catch (error) {
        console.error("Failed to load git settings:", error);
      }
    },

    setGitEnabled: async (enabled: boolean) => {
      set({ gitEnabled: enabled });
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          setSetting(db, "git.enabled", enabled ? "true" : "false"),
        );
      } catch (error) {
        console.error("Failed to save git.enabled setting:", error);
      }
    },
  };
}
