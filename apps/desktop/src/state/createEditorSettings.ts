import {
  defaultEditorSettings,
  isEditorFont,
  saveEditorSetting,
  type EditorFont,
  type EditorSettings,
  type EditorSettingsStorage,
} from "@app/editor";
import type Database from "@tauri-apps/plugin-sql";
import {
  DEFAULT_ATTACHMENT_SETTINGS,
  parseAttachmentSettings,
  type AttachmentSettings,
} from "@app/attachments";
import { getSetting, getVaultIndexDb, setSetting } from "../vault";
import { withDbLock } from "../vault/sqliteIndex";

export interface EditorSettingsState extends EditorSettings {
  attachmentSettings: AttachmentSettings;
  loadSettings: () => Promise<void>;
  setEditorFont: (font: EditorFont) => Promise<void>;
  setStrictLineBreaks: (enabled: boolean) => Promise<void>;
  setUseVimMode: (enabled: boolean) => Promise<void>;
  setAttachmentSettings: (settings: AttachmentSettings) => Promise<void>;
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
    attachmentSettings: DEFAULT_ATTACHMENT_SETTINGS,

    loadSettings: async () => {
      try {
        const db = await getVaultIndexDb();
        const editorFont = await withDbLock(() => getSetting(db, "editorFont"));
        const strictLineBreaks = await withDbLock(() =>
          getSetting(db, "strictLineBreaks"),
        );
        const useVimMode = await withDbLock(() => getSetting(db, "useVimMode"));
        const attachmentSettings = await withDbLock(() =>
          getSetting(db, "attachmentSettings"),
        );
        set({
          editorFont: isEditorFont(editorFont)
            ? editorFont
            : defaultEditorSettings.editorFont,
          strictLineBreaks: strictLineBreaks === "true",
          useVimMode: useVimMode === "true",
          attachmentSettings: parseAttachmentSettings(attachmentSettings),
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

    setUseVimMode: async (enabled: boolean) => {
      set({ useVimMode: enabled });
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          saveEditorSetting(
            vaultEditorSettingsStorage(db),
            "useVimMode",
            enabled,
          ),
        );
      } catch (error) {
        console.error("Failed to save Vim Keybindings setting", error);
      }
    },

    setAttachmentSettings: async (settings: AttachmentSettings) => {
      set({ attachmentSettings: settings });
      try {
        const db = await getVaultIndexDb();
        await withDbLock(() =>
          setSetting(db, "attachmentSettings", JSON.stringify(settings)),
        );
      } catch (error) {
        console.error("Failed to save attachment settings", error);
      }
    },
  };
}
