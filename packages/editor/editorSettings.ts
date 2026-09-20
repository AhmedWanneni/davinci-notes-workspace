export const editorFonts = ["system", "monospace", "inter", "roboto"] as const;

export type EditorFont = (typeof editorFonts)[number];

export interface EditorSettings {
  editorFont: EditorFont;
  editorFontSize: number;
  strictLineBreaks: boolean;
  useVimMode: boolean;
}

export interface EditorSettingsStorage {
  get(key: keyof EditorSettings): Promise<string | null>;
  set(key: keyof EditorSettings, value: string): Promise<void>;
}

export const defaultEditorSettings: EditorSettings = {
  editorFont: "system",
  editorFontSize: 16,
  strictLineBreaks: false,
  useVimMode: false,
};

export function isEditorFont(value: string | null): value is EditorFont {
  return editorFonts.some((font) => font === value);
}

export const MIN_EDITOR_FONT_SIZE = 12;
export const MAX_EDITOR_FONT_SIZE = 28;

export function clampEditorFontSize(value: string | number | null): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return defaultEditorSettings.editorFontSize;
  return Math.min(
    MAX_EDITOR_FONT_SIZE,
    Math.max(MIN_EDITOR_FONT_SIZE, Math.round(parsed)),
  );
}

export async function loadEditorSettings(
  storage: Pick<EditorSettingsStorage, "get">,
): Promise<EditorSettings> {
  const editorFont = await storage.get("editorFont");
  const editorFontSize = await storage.get("editorFontSize");
  const strictLineBreaks = await storage.get("strictLineBreaks");
  const useVimMode = await storage.get("useVimMode");

  return {
    editorFont: isEditorFont(editorFont)
      ? editorFont
      : defaultEditorSettings.editorFont,
    editorFontSize: clampEditorFontSize(editorFontSize),
    strictLineBreaks: strictLineBreaks === "true",
    useVimMode: useVimMode === "true",
  };
}

export async function saveEditorSetting(
  storage: Pick<EditorSettingsStorage, "set">,
  key: keyof EditorSettings,
  value: EditorSettings[keyof EditorSettings],
): Promise<void> {
  await storage.set(key, String(value));
}
