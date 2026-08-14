/**
 * JSON Canvas color representation.
 * Color values can be an Obsidian preset index ("1" to "6")
 * or a 6-digit hex color format string (e.g. "#ff0000").
 */
export type CanvasColorPreset = "1" | "2" | "3" | "4" | "5" | "6";
export type CanvasColor = CanvasColorPreset | string;

export const CANVAS_COLOR_PRESETS: readonly CanvasColorPreset[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
] as const;

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Check if a given string is a valid Obsidian color preset ("1" through "6").
 */
export function isPresetColor(value: unknown): value is CanvasColorPreset {
  return (
    typeof value === "string" &&
    CANVAS_COLOR_PRESETS.includes(value as CanvasColorPreset)
  );
}

/**
 * Check if a given string is a valid hex color (#rgb, #rrggbb, #rrggbbaa).
 */
export function isHexColor(value: unknown): boolean {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

/**
 * Check if a given value is a valid CanvasColor.
 */
export function isCanvasColor(value: unknown): value is CanvasColor {
  if (typeof value !== "string") return false;
  return isPresetColor(value) || isHexColor(value);
}
