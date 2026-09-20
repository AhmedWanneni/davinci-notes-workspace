import type { EditorFont } from "@app/editor";

export interface EditorFontDefinition {
  id: EditorFont;
  label: string;
  category: "sans";
  cssFamily: string;
  load: () => Promise<unknown>;
}

export const editorFontRegistry: readonly EditorFontDefinition[] = [
  {
    id: "system",
    label: "System default",
    category: "sans",
    cssFamily: "var(--font-ui)",
    load: async () => undefined,
  },
  {
    id: "montserrat",
    label: "Montserrat",
    category: "sans",
    cssFamily: '"Montserrat Variable", var(--font-ui)',
    load: () => import("./montserrat.css"),
  },
  {
    id: "raleway",
    label: "Raleway",
    category: "sans",
    cssFamily: '"Raleway Variable", var(--font-ui)',
    load: () => import("./raleway.css"),
  },
];

export function getEditorFont(font: string): EditorFontDefinition {
  return (
    editorFontRegistry.find((entry) => entry.id === font) ??
    editorFontRegistry[0]
  );
}

export async function loadEditorFont(
  font: string,
): Promise<EditorFontDefinition> {
  const entry = getEditorFont(font);
  await entry.load();
  if (entry.id !== "system" && "fonts" in document) {
    await Promise.all([
      document.fonts.load(`400 1em ${entry.cssFamily.split(",")[0]}`),
      document.fonts.load(`italic 400 1em ${entry.cssFamily.split(",")[0]}`),
      document.fonts.load(`700 1em ${entry.cssFamily.split(",")[0]}`),
    ]);
  }
  return entry;
}
