export interface CursorPreset {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export const DEFAULT_CURSOR_COLOR = "default";

export const CURSOR_COLOR_PRESETS: readonly CursorPreset[] = [
  { id: "default", label: "Default (Text color)", value: "default" },
  { id: "accent", label: "Accent color", value: "var(--color-interactive-accent)" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "black", label: "Black", value: "#000000" },
  { id: "green", label: "Neon Green", value: "#2ecc71" },
  { id: "amber", label: "Amber", value: "#f1c40f" },
] as const;

const CURSOR_STORAGE_KEY = "davinci-cursor-color";

export function applyCursorColor(color: string | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!color || color === DEFAULT_CURSOR_COLOR) {
    root.style.removeProperty("--color-editor-cursor");
    return;
  }
  root.style.setProperty("--color-editor-cursor", color);
}

export function loadSavedCursorColor(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(CURSOR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveCursorColor(color: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (color === DEFAULT_CURSOR_COLOR) {
      window.localStorage.removeItem(CURSOR_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CURSOR_STORAGE_KEY, color);
    }
  } catch {
    // Ignore storage quota/permission failures
  }
}
