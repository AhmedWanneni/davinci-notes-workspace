import { createContext, useContext } from "react";
import type { NativeThemeTokens } from "./themeTypes";
import type { ThemeMode } from "./themePersistence";
import { darkBTokens } from "./builtinThemeTokens";
import { generateThemeCss } from "./generateThemeCss";

export interface ThemeContextValue {
  tokens: NativeThemeTokens;
  activeThemeId: string;
  themeMode: ThemeMode;
  isDark: boolean;
  themeCss: string;
  setTheme: (themeId: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const defaultFallbackThemeContext: ThemeContextValue = {
  tokens: darkBTokens,
  activeThemeId: "dark-b",
  themeMode: "system",
  isDark: true,
  themeCss: generateThemeCss(darkBTokens),
  setTheme: async () => {},
  setThemeMode: async () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(
  defaultFallbackThemeContext,
);

export function useTheme(): ThemeContextValue {
  try {
    const context = useContext(ThemeContext);
    return context ?? defaultFallbackThemeContext;
  } catch {
    return defaultFallbackThemeContext;
  }
}
