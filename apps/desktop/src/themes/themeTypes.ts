import type { ThemeManifest } from "@app/theme-api";

export interface ThemeRecord {
  id: string;
  manifest: ThemeManifest;
  dirName: string;
}

export interface ThemeDiscoveryError {
  dirName: string;
  error: string;
}

export interface ThemeFileSystemAdapter {
  listThemeDirectories: () => Promise<string[]>;
  readThemeFile: (dirName: string, relativePath: string) => Promise<string>;
}

export interface ThemeStateStorage {
  loadActiveThemeId: () => Promise<string | null>;
  saveActiveThemeId: (themeId: string | null) => Promise<void>;
}
