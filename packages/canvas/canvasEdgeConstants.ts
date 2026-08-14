import type { CanvasColor, CanvasColorPreset } from "./CanvasColor";

export interface CanvasEdgeColorOption {
  preset?: CanvasColorPreset;
  label: string;
  cssColor: string;
}

export const CANVAS_EDGE_PALETTE: readonly CanvasEdgeColorOption[] = [
  { label: "Default", cssColor: "var(--color-border-normal, #363636)" },
  { preset: "1", label: "Red", cssColor: "var(--color-text-error, #e55353)" },
  { preset: "2", label: "Orange", cssColor: "#e67e22" },
  {
    preset: "3",
    label: "Yellow",
    cssColor: "var(--color-text-warning, #f1c40f)",
  },
  {
    preset: "4",
    label: "Green",
    cssColor: "var(--color-text-success, #2ecc71)",
  },
  { preset: "5", label: "Cyan", cssColor: "#00cec9" },
  {
    preset: "6",
    label: "Purple",
    cssColor: "var(--color-interactive-accent, #7f6df2)",
  },
] as const;

export function getCanvasEdgeColorCss(color?: CanvasColor): string {
  if (!color) return "var(--color-border-normal, #363636)";
  const option = CANVAS_EDGE_PALETTE.find((item) => item.preset === color);
  if (option) return option.cssColor;
  return color;
}

export function createCanvasEdgeId(): string {
  return `edge-${crypto.randomUUID()}`;
}
