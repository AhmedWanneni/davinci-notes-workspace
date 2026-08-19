import {
  defaultEditorSettings,
  isEditorFont,
  saveEditorSetting,
  type EditorFont,
  type EditorSettings,
  type EditorSettingsStorage,
} from "@app/editor";
import type Database from "@tauri-apps/plugin-sql";
import { getSetting, getVaultIndexDb, setSetting } from "../vault";
import { withDbLock } from "../vault/sqliteIndex";

export interface EditorSettingsState extends EditorSettings {
  loadSettings: () => Promise<void>;
  setEditorFont: (font: EditorFont) => Promise<void>;
  setStrictLineBreaks: (enabled: boolean) => Promise<void>;
}

type SetEditorSettings = (state: Partial<EditorSettingsState>) => void;

function vaultEditorSettingsStorage(db: Database): EditorSettingsStorage {
  return {
    get: (key) => getSetting(db, key),
    set: (key, value) => setSetting(db, key, value),
  };
}

/** Create persisted editor preferences backed by the existing SQLite settings table. */
export function createEditorSettings(
  set: SetEditorSettings,
): EditorSettingsState {
  return {
    ...defaultEditorSettings,

    loadSettings: async () => {
      try {
        const db = await getVaultIndexDb();
        const editorFont = await withDbLock(() => getSetting(db, "editorFont"));
        const strictLineBreaks = await withDbLock(() =>
          getSetting(db, "strictLineBreaks"),
        );
        set({
          editorFont: isEditorFont(editorFont)
            ? editorFont
            : defaultEditorSettings.editorFont,
          strictLineBreaks: strictLineBreaks === "true",
        });
      } catch (error) {
        console.error("Failed to load editor settings", error);
      }
    },

    setEditorFont: async (font: EditorFont) => {
      set({ editorFont: font });
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          saveEditorSetting(vaultEditorSettingsStorage(db), "editorFont", font),
        );
      } catch (error) {
        console.error("Failed to save editor font", error);
      }
    },

    setStrictLineBreaks: async (enabled: boolean) => {
      set({ strictLineBreaks: enabled });
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          saveEditorSetting(
            vaultEditorSettingsStorage(db),
            "strictLineBreaks",
            enabled,
          ),
        );
      } catch (error) {
        console.error("Failed to save Strict Line Breaks", error);
      }
    },
  };
}
