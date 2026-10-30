export interface AccentPreset {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export const DEFAULT_ACCENT_COLOR = "#cd47ab";

export const ACCENT_COLOR_PRESETS: readonly AccentPreset[] = [
  { id: "magenta", label: "Pink / Magenta", value: "#cd47ab" },
  { id: "purple", label: "Obsidian Purple", value: "#7f6df2" },
  { id: "blue", label: "Ocean Blue", value: "#0969da" },
  { id: "green", label: "Emerald Green", value: "#2ecc71" },
  { id: "amber", label: "Warm Amber", value: "#f1c40f" },
  { id: "coral", label: "Coral Red", value: "#e55353" },
] as const;

const ACCENT_STORAGE_KEY = "davinci-accent-color";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (channel: number) => {
    const adjusted = Math.round(channel + (percent >= 0 ? (255 - channel) * percent : channel * percent));
    return Math.max(0, Math.min(255, adjusted)).toString(16).padStart(2, "0");
  };
  return `#${adjust(rgb.r)}${adjust(rgb.g)}${adjust(rgb.b)}`;
}

export function applyAccentColor(hexColor: string | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!hexColor) {
    root.style.removeProperty("--color-interactive-accent");
    root.style.removeProperty("--color-interactive-accent-hover");
    root.style.removeProperty("--color-interactive-accent-active");
    root.style.removeProperty("--color-text-accent");
    root.style.removeProperty("--color-border-focus");
    root.style.removeProperty("--color-border-status-accent");
    root.style.removeProperty("--color-bg-status-accent");
    return;
  }

  const rgb = hexToRgb(hexColor);
  const hoverColor = adjustBrightness(hexColor, 0.15);
  const activeColor = adjustBrightness(hexColor, -0.15);
  const statusBg = rgb ? `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 12%)` : "rgb(205 71 171 / 12%)";
  const statusBorder = rgb ? `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 30%)` : "rgb(205 71 171 / 30%)";

  root.style.setProperty("--color-interactive-accent", hexColor);
  root.style.setProperty("--color-interactive-accent-hover", hoverColor);
  root.style.setProperty("--color-interactive-accent-active", activeColor);
  root.style.setProperty("--color-text-accent", hexColor);
  root.style.setProperty("--color-border-focus", hexColor);
  root.style.setProperty("--color-border-status-accent", statusBorder);
  root.style.setProperty("--color-bg-status-accent", statusBg);
}

export function loadSavedAccentColor(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage.getItem(ACCENT_STORAGE_KEY);
}

export function saveAccentColor(hexColor: string | null): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (hexColor) {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, hexColor);
  } else {
    window.localStorage.removeItem(ACCENT_STORAGE_KEY);
  }
}
