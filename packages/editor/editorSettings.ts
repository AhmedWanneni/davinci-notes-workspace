export const editorFonts = ["system", "monospace", "inter", "roboto"] as const;

export type EditorFont = (typeof editorFonts)[number];

export interface EditorSettings {
  editorFont: EditorFont;
  strictLineBreaks: boolean;
}

export interface EditorSettingsStorage {
  get(key: keyof EditorSettings): Promise<string | null>;
  set(key: keyof EditorSettings, value: string): Promise<void>;
}

export const defaultEditorSettings: EditorSettings = {
  editorFont: "system",
  strictLineBreaks: false,
};

export function isEditorFont(value: string | null): value is EditorFont {
  return editorFonts.some((font) => font === value);
}

export async function loadEditorSettings(
  storage: Pick<EditorSettingsStorage, "get">,
): Promise<EditorSettings> {
  const editorFont = await storage.get("editorFont");
  const strictLineBreaks = await storage.get("strictLineBreaks");

  return {
    editorFont: isEditorFont(editorFont)
      ? editorFont
      : defaultEditorSettings.editorFont,
    strictLineBreaks: strictLineBreaks === "true",
  };
}

export async function saveEditorSetting(
  storage: Pick<EditorSettingsStorage, "set">,
  key: keyof EditorSettings,
  value: EditorSettings[keyof EditorSettings],
): Promise<void> {
  await storage.set(key, String(value));
}
