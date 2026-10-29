import {
  borderRadiusTokens,
  borderWidthTokens,
  spacingTokens,
  typographyTokens,
  iconSizeTokens,
} from "@app/design-tokens";
import type { NativeThemeTokens } from "./themeTypes";
import {
  defaultMobileLayout,
  catppuccinFrappeTokens,
  catppuccinLatteTokens,
} from "./catppuccinThemeTokens";

export { defaultMobileLayout, catppuccinFrappeTokens, catppuccinLatteTokens };

export const lightATokens: NativeThemeTokens = {
  id: "light-a",
  name: "Light A",
  isDark: false,
  color: {
    bg: {
      primary: "#ffffff",
      "primary-alt": "#f6f6f6",
      secondary: "#f6f6f6",
      "secondary-alt": "#f6f6f6",
      scrim: "rgb(0 0 0 / 25%)",
      "status-accent": "rgb(205 71 171 / 12%)",
      "status-success": "rgb(46 204 113 / 12%)",
      "status-warning": "rgb(241 196 15 / 12%)",
      "status-error": "rgb(229 83 83 / 12%)",
      hover: "rgba(0, 0, 0, 0.05)",
      active: "rgba(0, 0, 0, 0.08)",
    },
    text: {
      normal: "#222222",
      muted: "#5c5c5c",
      faint: "#ababab",
      accent: "#cd47ab",
      "on-accent": "#ffffff",
      error: "#e55353",
      success: "#2ecc71",
      warning: "#f1c40f",
    },
    border: {
      subtle: "#e4e4e4",
      normal: "#d4d4d4",
      focus: "#cd47ab",
      "status-accent": "rgb(205 71 171 / 30%)",
      "status-success": "rgb(46 204 113 / 30%)",
      "status-warning": "rgb(241 196 15 / 30%)",
      "status-error": "rgb(229 83 83 / 30%)",
    },
    interactive: {
      accent: "#cd47ab",
      "accent-hover": "#dc5fbc",
      "accent-active": "#b43296",
    },
    shadow: "rgb(0 0 0 / 12%)",
  },
  radius: borderRadiusTokens,
  borderWidth: borderWidthTokens,
  space: spacingTokens,
  typography: typographyTokens,
  iconSize: iconSizeTokens,
  layout: defaultMobileLayout,
};

export const darkBTokens: NativeThemeTokens = {
  id: "dark-b",
  name: "Dark B",
  isDark: true,
  color: {
    bg: {
      primary: "#1e1e1e",
      "primary-alt": "#161616",
      secondary: "#262626",
      "secondary-alt": "#202020",
      scrim: "rgb(0 0 0 / 60%)",
      "status-accent": "rgb(205 71 171 / 15%)",
      "status-success": "rgb(46 204 113 / 15%)",
      "status-warning": "rgb(241 196 15 / 15%)",
      "status-error": "rgb(229 83 83 / 15%)",
      hover: "rgba(255, 255, 255, 0.05)",
      active: "rgba(255, 255, 255, 0.08)",
    },
    text: {
      normal: "#dcddde",
      muted: "#888888",
      faint: "#555555",
      accent: "#cd47ab",
      "on-accent": "#ffffff",
      error: "#e55353",
      success: "#2ecc71",
      warning: "#f1c40f",
    },
    border: {
      subtle: "#2e2e2e",
      normal: "#363636",
      focus: "#cd47ab",
      "status-accent": "rgb(205 71 171 / 30%)",
      "status-success": "rgb(46 204 113 / 30%)",
      "status-warning": "rgb(241 196 15 / 30%)",
      "status-error": "rgb(229 83 83 / 30%)",
    },
    interactive: {
      accent: "#cd47ab",
      "accent-hover": "#dc5fbc",
      "accent-active": "#b43296",
    },
    shadow: "rgb(0 0 0)",
  },
  radius: borderRadiusTokens,
  borderWidth: borderWidthTokens,
  space: spacingTokens,
  typography: typographyTokens,
  iconSize: iconSizeTokens,
  layout: defaultMobileLayout,
};

export const BUILTIN_THEMES: Record<string, NativeThemeTokens> = {
  "catppuccin-frappe": catppuccinFrappeTokens,
  "catppuccin-latte": catppuccinLatteTokens,
  "light-a": lightATokens,
  "dark-b": darkBTokens,
};
