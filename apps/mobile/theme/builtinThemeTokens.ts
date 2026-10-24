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
      primary: "#fafafa",
      "primary-alt": "#f2f2f2",
      secondary: "#ffffff",
      "secondary-alt": "#f6f6f6",
      scrim: "rgb(28 31 36 / 28%)",
      "status-accent": "rgb(9 105 218 / 10%)",
      "status-success": "rgb(26 127 55 / 10%);",
      "status-warning": "rgb(154 103 0 / 12%)",
      "status-error": "rgb(207 34 46 / 10%)",
      hover: "rgb(30 35 40 / 6%)",
      active: "rgb(30 35 40 / 10%)",
    },
    text: {
      normal: "#1f2328",
      muted: "#57606a",
      faint: "#8c959f",
      accent: "#0969da",
      "on-accent": "#ffffff",
      error: "#cf222e",
      success: "#1a7f37",
      warning: "#9a6700",
    },
    border: {
      subtle: "#d8dee4",
      normal: "#afb8c1",
      focus: "#0969da",
      "status-accent": "rgb(9 105 218 / 35%)",
      "status-success": "rgb(26 127 55 / 35%)",
      "status-warning": "rgb(154 103 0 / 38%)",
      "status-error": "rgb(207 34 46 / 35%)",
    },
    interactive: {
      accent: "#0969da",
      "accent-hover": "#0757b4",
      "accent-active": "#0550ae",
    },
    shadow: "rgb(31 35 40)",
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
      primary: "#000000",
      "primary-alt": "#080808",
      secondary: "#111111",
      "secondary-alt": "#0a0a0a",
      scrim: "rgb(0 0 0 / 80%)",
      "status-accent": "rgb(0 204 255 / 16%)",
      "status-success": "rgb(67 215 139 / 16%)",
      "status-warning": "rgb(255 196 61 / 18%)",
      "status-error": "rgb(255 92 92 / 16%)",
      hover: "rgb(255 255 255 / 9%)",
      active: "rgb(255 255 255 / 15%)",
    },
    text: {
      normal: "#f5f7fa",
      muted: "#b8c0cc",
      faint: "#77808c",
      accent: "#66ddff",
      "on-accent": "#001018",
      error: "#ff8a8a",
      success: "#75e0a0",
      warning: "#ffd166",
    },
    border: {
      subtle: "#262b33",
      normal: "#596273",
      focus: "#00ccff",
      "status-accent": "rgb(0 204 255 / 48%)",
      "status-success": "rgb(67 215 139 / 48%)",
      "status-warning": "rgb(255 196 61 / 50%)",
      "status-error": "rgb(255 92 92 / 48%)",
    },
    interactive: {
      accent: "#00ccff",
      "accent-hover": "#66ddff",
      "accent-active": "#00a8d6",
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
