import type { ColorTokens } from "@app/design-tokens";
import type { NativeThemeTokens } from "./themeTypes";
import { darkBTokens, lightATokens } from "./builtinThemeTokens";

/**
 * Parses raw CSS containing :root variable declarations and extracts
 * them into a NativeThemeTokens object matching the DaVinci Notes token contract.
 */
export function parseThemeTokensFromCss(
  css: string,
  id = "custom-theme",
  name = "Custom Theme",
  fallback: NativeThemeTokens = darkBTokens,
): NativeThemeTokens {
  const varMap: Record<string, string> = {};

  // Extract all CSS custom properties declared inside :root or rules: --[name]: [value];
  const varRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null = null;
  while ((match = varRegex.exec(css)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim();
    varMap[key] = val;
  }

  // Determine if theme is dark based on background color or explicit keywords
  const primaryBg = varMap["color-bg-primary"] ?? fallback.color.bg.primary;
  const isDark = isDarkColor(primaryBg);

  const base = isDark
    ? fallback.isDark
      ? fallback
      : darkBTokens
    : !fallback.isDark
      ? fallback
      : lightATokens;

  const color: ColorTokens = {
    bg: {
      primary: varMap["color-bg-primary"] ?? base.color.bg.primary,
      "primary-alt":
        varMap["color-bg-primary-alt"] ?? base.color.bg["primary-alt"],
      secondary: varMap["color-bg-secondary"] ?? base.color.bg.secondary,
      "secondary-alt":
        varMap["color-bg-secondary-alt"] ?? base.color.bg["secondary-alt"],
      scrim: varMap["color-bg-scrim"] ?? base.color.bg.scrim,
      "status-accent":
        varMap["color-bg-status-accent"] ?? base.color.bg["status-accent"],
      "status-success":
        varMap["color-bg-status-success"] ?? base.color.bg["status-success"],
      "status-warning":
        varMap["color-bg-status-warning"] ?? base.color.bg["status-warning"],
      "status-error":
        varMap["color-bg-status-error"] ?? base.color.bg["status-error"],
      hover: varMap["color-bg-hover"] ?? base.color.bg.hover,
      active: varMap["color-bg-active"] ?? base.color.bg.active,
    },
    text: {
      normal: varMap["color-text-normal"] ?? base.color.text.normal,
      muted: varMap["color-text-muted"] ?? base.color.text.muted,
      faint: varMap["color-text-faint"] ?? base.color.text.faint,
      accent: varMap["color-text-accent"] ?? base.color.text.accent,
      "on-accent":
        varMap["color-text-on-accent"] ?? base.color.text["on-accent"],
      error: varMap["color-text-error"] ?? base.color.text.error,
      success: varMap["color-text-success"] ?? base.color.text.success,
      warning: varMap["color-text-warning"] ?? base.color.text.warning,
    },
    border: {
      subtle: varMap["color-border-subtle"] ?? base.color.border.subtle,
      normal: varMap["color-border-normal"] ?? base.color.border.normal,
      focus: varMap["color-border-focus"] ?? base.color.border.focus,
      "status-accent":
        varMap["color-border-status-accent"] ??
        base.color.border["status-accent"],
      "status-success":
        varMap["color-border-status-success"] ??
        base.color.border["status-success"],
      "status-warning":
        varMap["color-border-status-warning"] ??
        base.color.border["status-warning"],
      "status-error":
        varMap["color-border-status-error"] ??
        base.color.border["status-error"],
    },
    interactive: {
      accent:
        varMap["color-interactive-accent"] ?? base.color.interactive.accent,
      "accent-hover":
        varMap["color-interactive-accent-hover"] ??
        base.color.interactive["accent-hover"],
      "accent-active":
        varMap["color-interactive-accent-active"] ??
        base.color.interactive["accent-active"],
    },
    shadow: varMap["color-shadow"] ?? base.color.shadow,
  };

  return {
    id,
    name,
    isDark,
    color,
    radius: {
      none: varMap["border-radius-none"] ?? base.radius.none,
      sm: varMap["border-radius-sm"] ?? base.radius.sm,
      md: varMap["border-radius-md"] ?? base.radius.md,
      lg: varMap["border-radius-lg"] ?? base.radius.lg,
      xl: base.radius.xl,
    },
    borderWidth: {
      thin: varMap["border-width-thin"] ?? base.borderWidth.thin,
      thick: varMap["border-width-thick"] ?? base.borderWidth.thick,
    },
    space: {
      1: varMap["space-1"] ?? base.space[1],
      2: varMap["space-2"] ?? base.space[2],
      3: varMap["space-3"] ?? base.space[3],
      4: varMap["space-4"] ?? base.space[4],
      6: varMap["space-6"] ?? base.space[6],
      8: varMap["space-8"] ?? base.space[8],
    },
    typography: {
      font: {
        ui: varMap["font-ui"] ?? base.typography.font.ui,
        editor: varMap["font-editor"] ?? base.typography.font.editor,
      },
      scale: {
        xs: varMap["type-scale-xs"] ?? base.typography.scale.xs,
        sm: varMap["type-scale-sm"] ?? base.typography.scale.sm,
        base: varMap["type-scale-base"] ?? base.typography.scale.base,
        lg: varMap["type-scale-lg"] ?? base.typography.scale.lg,
        xl: varMap["type-scale-xl"] ?? base.typography.scale.xl,
        "2xl": varMap["type-scale-2xl"] ?? base.typography.scale["2xl"],
      },
      weight: {
        regular:
          varMap["type-weight-regular"] ?? base.typography.weight.regular,
        medium: varMap["type-weight-medium"] ?? base.typography.weight.medium,
        semibold:
          varMap["type-weight-semibold"] ?? base.typography.weight.semibold,
        bold: varMap["type-weight-bold"] ?? base.typography.weight.bold,
      },
      leading: {
        tight: varMap["type-leading-tight"] ?? base.typography.leading.tight,
        normal: varMap["type-leading-normal"] ?? base.typography.leading.normal,
        relaxed:
          varMap["type-leading-relaxed"] ?? base.typography.leading.relaxed,
      },
    },
    iconSize: {
      xs: varMap["icon-size-xs"] ?? base.iconSize.xs,
      sm: varMap["icon-size-sm"] ?? base.iconSize.sm,
      md: varMap["icon-size-md"] ?? base.iconSize.md,
      lg: varMap["icon-size-lg"] ?? base.iconSize.lg,
      xl: varMap["icon-size-xl"] ?? base.iconSize.xl,
    },
    layout: {
      capsuleRadius: varMap["radius-capsule"] ?? base.layout.capsuleRadius,
      sheetGroupRadius:
        varMap["radius-sheet-group"] ?? base.layout.sheetGroupRadius,
      touchTarget: base.layout.touchTarget,
    },
  };
}

/**
 * Computes luminance heuristic for a hex or rgb color string to identify dark vs light backgrounds.
 */
function isDarkColor(colorStr: string): boolean {
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    const r =
      parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16) || 0;
    const g =
      parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16) || 0;
    const b =
      parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16) || 0;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
  }
  return true;
}
