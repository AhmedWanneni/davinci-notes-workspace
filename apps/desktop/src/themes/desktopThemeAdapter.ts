import { listThemeDirectories, readThemeFile } from "../vault/vaultCommands";
import type { ThemeFileSystemAdapter, ThemeStateStorage } from "./themeTypes";

const ACTIVE_THEME_STORAGE_KEY = "davinci.active-theme";
const THEME_STYLE_ATTRIBUTE = "data-davinci-theme";

interface PersistedTheme {
  id: string | null;
  css?: string;
  source?: "builtin" | "vault";
}

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
        return readPersistedTheme()?.id ?? null;
      } catch (error) {
        console.warn("Failed to load active theme:", error);
        return null;
      }
    },
    async saveActiveTheme(themeId, css, source) {
      try {
        const value: PersistedTheme = {
          id: themeId,
          ...(source === "builtin" && css ? { css, source } : {}),
        };
        window.localStorage.setItem(
          ACTIVE_THEME_STORAGE_KEY,
          JSON.stringify(value),
        );
      } catch (error) {
        console.error("Failed to save active theme:", error);
      }
    },
  };
}

export function restoreCachedBuiltinTheme(): string | null {
  const persisted = readPersistedTheme();
  if (!persisted?.id || persisted.source !== "builtin" || !persisted.css)
    return null;
  const existing = document.querySelector("style[data-davinci-theme]");
  if (existing) return persisted.id;
  const style = document.createElement("style");
  style.setAttribute(THEME_STYLE_ATTRIBUTE, persisted.id);
  style.textContent = persisted.css;
  document.head.append(style);
  return persisted.id;
}

function readPersistedTheme(): PersistedTheme | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PersistedTheme;
    return typeof value.id === "string" || value.id === null ? value : null;
  } catch {
    return null;
  }
}
