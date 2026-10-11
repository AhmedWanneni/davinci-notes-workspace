import { validateAndSanitizeCustomFont, type EditorFont } from "@app/editor";

export interface EditorFontDefinition {
  id: EditorFont;
  label: string;
  category: "sans" | "serif" | "monospace" | "custom";
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
    id: "serif",
    label: "Serif",
    category: "serif",
    cssFamily:
      'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif',
    load: async () => undefined,
  },
  {
    id: "monospace",
    label: "Monospace",
    category: "monospace",
    cssFamily:
      '"JetBrains Mono", "Fira Code", Menlo, Consolas, Monaco, monospace',
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
  {
    id: "custom",
    label: "Custom",
    category: "custom",
    cssFamily: "var(--font-ui)",
    load: async () => undefined,
  },
  {
    id: "roboto",
    label: "Roboto",
    category: "sans",
    cssFamily: '"Roboto Variable", var(--font-ui)',
    load: () => import("./roboto.css"),
  },
];

export function getEditorFont(
  font: string,
  customFont?: string,
): EditorFontDefinition {
  if (font === "custom") {
    const validated = validateAndSanitizeCustomFont(customFont);
    return {
      id: "custom",
      label: "Custom",
      category: "custom",
      cssFamily: validated.isValid ? validated.cssFamily : "var(--font-ui)",
      load: async () => undefined,
    };
  }

  return (
    editorFontRegistry.find((entry) => entry.id === font) ??
    editorFontRegistry[0]!
  );
}

export async function loadEditorFont(
  font: string,
  customFont?: string,
): Promise<EditorFontDefinition> {
  const entry = getEditorFont(font, customFont);
  await entry.load();
  if (
    entry.id !== "system" &&
    typeof document !== "undefined" &&
    "fonts" in document
  ) {
    const primaryFace = entry.cssFamily.split(",")[0]?.trim();
    if (primaryFace) {
      try {
        await Promise.allSettled([
          document.fonts.load(`400 1em ${primaryFace}`),
          document.fonts.load(`italic 400 1em ${primaryFace}`),
          document.fonts.load(`700 1em ${primaryFace}`),
        ]);
      } catch {
        // Fallback gracefully without breaking rendering
      }
    }
  }
  return entry;
}
