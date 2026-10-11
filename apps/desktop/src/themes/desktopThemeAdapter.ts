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
          ...(css ? { css, source: source ?? undefined } : {}),
        };
        window.localStorage.setItem(
          ACTIVE_THEME_STORAGE_KEY,
          JSON.stringify(value),
        );
        try {
          const { emit } = await import("@tauri-apps/api/event");
          await emit("davinci-theme-changed", {
            id: themeId,
            css: css ?? null,
          });
        } catch {
          // Ignored outside Tauri
        }
      } catch (error) {
        console.error("Failed to save active theme:", error);
      }
    },
  };
}

export function applyThemeCss(
  themeId: string | null,
  css: string | null,
): void {
  const existing = document.querySelector(`style[${THEME_STYLE_ATTRIBUTE}]`);
  if (!themeId || !css) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.setAttribute(THEME_STYLE_ATTRIBUTE, themeId);
    existing.textContent = css;
    return;
  }
  const style = document.createElement("style");
  style.setAttribute(THEME_STYLE_ATTRIBUTE, themeId);
  style.textContent = css;
  document.head.append(style);
}

export function restoreCachedBuiltinTheme(): string | null {
  const persisted = readPersistedTheme();
  if (!persisted?.id || !persisted.css) {
    if (persisted?.id === null) {
      applyThemeCss(null, null);
    }
    return null;
  }
  applyThemeCss(persisted.id, persisted.css);
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
