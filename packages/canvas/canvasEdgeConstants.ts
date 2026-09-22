import type { CanvasColor, CanvasColorPreset } from "./CanvasColor";

export interface CanvasEdgeColorOption {
  preset?: CanvasColorPreset;
  label: string;
  cssColor: string;
}

export const CANVAS_EDGE_PALETTE: readonly CanvasEdgeColorOption[] = [
  { label: "Default", cssColor: "var(--color-border-normal)" },
  { preset: "1", label: "Red", cssColor: "var(--color-text-error)" },
  { preset: "2", label: "Orange", cssColor: "var(--color-text-warning)" },
  {
    preset: "3",
    label: "Yellow",
    cssColor: "var(--color-text-warning)",
  },
  {
    preset: "4",
    label: "Green",
    cssColor: "var(--color-text-success)",
  },
  { preset: "5", label: "Cyan", cssColor: "var(--color-text-accent)" },
  {
    preset: "6",
    label: "Purple",
    cssColor: "var(--color-interactive-accent)",
  },
] as const;

export function getCanvasEdgeColorCss(color?: CanvasColor): string {
  if (!color) return "var(--color-border-normal)";
  const option = CANVAS_EDGE_PALETTE.find((item) => item.preset === color);
  if (option) return option.cssColor;
  return color;
}

export function createCanvasEdgeId(): string {
  return `edge-${crypto.randomUUID()}`;
}
