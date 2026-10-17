export const editorFonts = [
  "system",
  "inter",
  "ibm-plex-sans",
  "literata",
  "source-serif-4",
  "jetbrains-mono",
  "montserrat",
  "raleway",
  "custom",
  "serif",
  "monospace",
  "roboto",
] as const;

export type EditorFont = (typeof editorFonts)[number];

export interface EditorSettings {
  editorFont: EditorFont;
  editorCustomFont?: string;
  editorFontSize: number;
  strictLineBreaks: boolean;
  useVimMode: boolean;
  vimMonospaceMode: boolean;
  slashMenuEnabled: boolean;
}

export interface EditorSettingsStorage {
  get(key: keyof EditorSettings): Promise<string | null>;
  set(key: keyof EditorSettings, value: string): Promise<void>;
}

export const MIN_EDITOR_FONT_SIZE = 12;
export const MAX_EDITOR_FONT_SIZE = 28;
export const DEFAULT_EDITOR_FONT_SIZE = 16;

export const defaultEditorSettings: EditorSettings = {
  editorFont: "system",
  editorCustomFont: "",
  editorFontSize: DEFAULT_EDITOR_FONT_SIZE,
  strictLineBreaks: false,
  useVimMode: false,
  vimMonospaceMode: true,
  slashMenuEnabled: true,
};

export function isEditorFont(
  value: string | null | undefined,
): value is EditorFont {
  return typeof value === "string" && editorFonts.includes(value as EditorFont);
}

export function clampEditorFontSize(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined || value === "") {
    return defaultEditorSettings.editorFontSize;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return defaultEditorSettings.editorFontSize;
  return Math.min(
    MAX_EDITOR_FONT_SIZE,
    Math.max(MIN_EDITOR_FONT_SIZE, Math.round(parsed)),
  );
}

const CUSTOM_FONT_MAX_LENGTH = 50;
const CUSTOM_FONT_PATTERN = /^[a-zA-Z0-9\s\-',.]+$/;

export interface CustomFontValidationResult {
  isValid: boolean;
  sanitized: string;
  cssFamily: string;
  error?: string;
}

export function validateAndSanitizeCustomFont(
  input: string | null | undefined,
): CustomFontValidationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      sanitized: "",
      cssFamily: "var(--font-ui)",
      error: "Font name is required",
    };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitized: "",
      cssFamily: "var(--font-ui)",
      error: "Font name cannot be empty",
    };
  }

  if (trimmed.length > CUSTOM_FONT_MAX_LENGTH) {
    return {
      isValid: false,
      sanitized: trimmed.slice(0, CUSTOM_FONT_MAX_LENGTH),
      cssFamily: "var(--font-ui)",
      error: `Font name must be ${CUSTOM_FONT_MAX_LENGTH} characters or less`,
    };
  }

  if (!CUSTOM_FONT_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      sanitized: "",
      cssFamily: "var(--font-ui)",
      error: "Font name contains invalid characters",
    };
  }

  // Escape backslashes and double quotes for safe CSS font-family injection
  const escaped = trimmed.replace(/["\\]/g, "\\$&");
  return {
    isValid: true,
    sanitized: trimmed,
    cssFamily: `"${escaped}", var(--font-ui)`,
  };
}

export async function loadEditorSettings(
  storage: Pick<EditorSettingsStorage, "get">,
): Promise<EditorSettings> {
  const editorFont = await storage.get("editorFont");
  const editorCustomFont = await storage.get("editorCustomFont");
  const editorFontSize = await storage.get("editorFontSize");
  const strictLineBreaks = await storage.get("strictLineBreaks");
  const useVimMode = await storage.get("useVimMode");
  const vimMonospaceMode = await storage.get("vimMonospaceMode");
  const slashMenuEnabled = await storage.get("slashMenuEnabled");

  const validatedCustom = validateAndSanitizeCustomFont(editorCustomFont);

  return {
    editorFont: isEditorFont(editorFont)
      ? editorFont
      : defaultEditorSettings.editorFont,
    editorCustomFont: validatedCustom.isValid ? validatedCustom.sanitized : "",
    editorFontSize: clampEditorFontSize(editorFontSize),
    strictLineBreaks: strictLineBreaks === "true",
    useVimMode: useVimMode === "true",
    vimMonospaceMode:
      vimMonospaceMode === null
        ? defaultEditorSettings.vimMonospaceMode
        : vimMonospaceMode === "true",
    slashMenuEnabled:
      slashMenuEnabled === null
        ? defaultEditorSettings.slashMenuEnabled
        : slashMenuEnabled === "true",
  };
}

export async function saveEditorSetting(
  storage: Pick<EditorSettingsStorage, "set">,
  key: keyof EditorSettings,
  value: EditorSettings[keyof EditorSettings],
): Promise<void> {
  await storage.set(key, String(value ?? ""));
}
