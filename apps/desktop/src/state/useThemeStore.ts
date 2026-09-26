import { create } from "zustand";
import {
  ThemeLifecycleManager,
  createDesktopThemeFsAdapter,
  createDesktopThemeStorage,
  restoreCachedBuiltinTheme,
  type ThemeDiscoveryError,
  type ThemeRecord,
} from "../themes";

export interface ThemeState {
  themes: ThemeRecord[];
  discoveryErrors: ThemeDiscoveryError[];
  activeThemeId: string | null;
  themeManager: ThemeLifecycleManager | null;
  initThemes: (vaultPath: string | null) => Promise<void>;
  activateTheme: (themeId: string | null) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes: [],
  discoveryErrors: [],
  activeThemeId: null,
  themeManager: null,
  initThemes: async (vaultPath) => {
    const manager = new ThemeLifecycleManager(
      vaultPath ? createDesktopThemeFsAdapter(vaultPath) : null,
      createDesktopThemeStorage(),
    );
    manager.onStateChange(() =>
      set({
        themes: manager.getThemes(),
        discoveryErrors: manager.getDiscoveryErrors(),
        activeThemeId: manager.getActiveThemeId(),
      }),
    );
    await manager.initialize();
    set({
      themeManager: manager,
      themes: manager.getThemes(),
      discoveryErrors: manager.getDiscoveryErrors(),
      activeThemeId: manager.getActiveThemeId(),
    });
  },
  activateTheme: async (themeId) => {
    await get().themeManager?.activateTheme(themeId);
  },
}));

restoreCachedBuiltinTheme();
