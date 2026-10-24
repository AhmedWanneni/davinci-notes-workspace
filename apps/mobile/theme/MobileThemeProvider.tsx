import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeContext, type ThemeContextValue } from "./useTheme";
import type { NativeThemeTokens } from "./themeTypes";
import {
  BUILTIN_THEMES,
  darkBTokens,
  lightATokens,
} from "./builtinThemeTokens";
import {
  loadThemeStateToCache,
  getCachedThemeState,
  saveThemeStateToDb,
  type ThemeMode,
} from "./themePersistence";
import { generateThemeCss } from "./generateThemeCss";

export interface MobileThemeProviderProps {
  children: React.ReactNode;
  initialThemeId?: string;
  initialMode?: ThemeMode;
}

export function MobileThemeProvider({
  children,
  initialThemeId,
  initialMode,
}: MobileThemeProviderProps): React.ReactElement {
  const systemColorScheme = useColorScheme();
  const cached = getCachedThemeState();

  const [activeThemeId, setActiveThemeId] = useState<string>(
    initialThemeId ?? cached.activeThemeId ?? "dark-b",
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    initialMode ?? cached.themeMode ?? "system",
  );

  useEffect(() => {
    let mounted = true;
    void loadThemeStateToCache().then((state) => {
      if (mounted) {
        if (!initialThemeId && state.activeThemeId) {
          setActiveThemeId(state.activeThemeId);
        }
        if (!initialMode && state.themeMode) {
          setThemeModeState(state.themeMode);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [initialThemeId, initialMode]);

  const activeTokens: NativeThemeTokens = useMemo(() => {
    if (themeMode === "system") {
      const isSystemDark = systemColorScheme !== "light";
      const candidate = BUILTIN_THEMES[activeThemeId];
      if (candidate && candidate.isDark === isSystemDark) {
        return candidate;
      }
      return isSystemDark ? darkBTokens : lightATokens;
    }

    if (themeMode === "light") {
      const candidate = BUILTIN_THEMES[activeThemeId];
      if (candidate && !candidate.isDark) {
        return candidate;
      }
      return lightATokens;
    }

    const candidate = BUILTIN_THEMES[activeThemeId];
    if (candidate && candidate.isDark) {
      return candidate;
    }
    return darkBTokens;
  }, [activeThemeId, themeMode, systemColorScheme]);

  const themeCss = useMemo(
    () => generateThemeCss(activeTokens),
    [activeTokens],
  );

  const setTheme = useCallback(
    async (themeId: string) => {
      const target = BUILTIN_THEMES[themeId];
      setActiveThemeId(themeId);
      if (target) {
        const matchingMode: ThemeMode = target.isDark ? "dark" : "light";
        setThemeModeState(matchingMode);
        await saveThemeStateToDb(themeId, matchingMode);
      } else {
        await saveThemeStateToDb(themeId, themeMode);
      }
    },
    [themeMode],
  );

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setThemeModeState(mode);
      let newThemeId = activeThemeId;
      if (mode === "light") {
        const current = BUILTIN_THEMES[activeThemeId];
        if (!current || current.isDark) {
          newThemeId = "catppuccin-latte";
          setActiveThemeId(newThemeId);
        }
      } else if (mode === "dark") {
        const current = BUILTIN_THEMES[activeThemeId];
        if (!current || !current.isDark) {
          newThemeId = "catppuccin-frappe";
          setActiveThemeId(newThemeId);
        }
      }
      await saveThemeStateToDb(newThemeId, mode);
    },
    [activeThemeId],
  );

  const contextValue: ThemeContextValue = useMemo(
    () => ({
      tokens: activeTokens,
      activeThemeId: activeTokens.id,
      themeMode,
      isDark: activeTokens.isDark,
      themeCss,
      setTheme,
      setThemeMode,
    }),
    [activeTokens, themeMode, themeCss, setTheme, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style={activeTokens.isDark ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}
