import { validateAndSanitizeCustomFont, type EditorFont } from "@app/editor";

export type EditorFontCategory =
  "system" | "sans" | "serif" | "monospace" | "display" | "custom";

export interface EditorFontDefinition {
  id: EditorFont;
  label: string;
  category: EditorFontCategory;
  cssFamily: string;
  load: () => Promise<unknown>;
}

export const editorFontRegistry: readonly EditorFontDefinition[] = [
  {
    id: "system",
    label: "System default",
    category: "system",
    cssFamily: "var(--font-ui)",
    load: async () => undefined,
  },
  {
    id: "inter",
    label: "Inter",
    category: "sans",
    cssFamily: '"Inter Variable", var(--font-ui)',
    load: () => import("./inter.css"),
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    category: "sans",
    cssFamily: '"IBM Plex Sans", var(--font-ui)',
    load: () => import("./ibm-plex-sans.css"),
  },
  {
    id: "literata",
    label: "Literata",
    category: "serif",
    cssFamily:
      '"Literata Variable", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif',
    load: () => import("./literata.css"),
  },
  {
    id: "source-serif-4",
    label: "Source Serif 4",
    category: "serif",
    cssFamily:
      '"Source Serif 4 Variable", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif',
    load: () => import("./source-serif-4.css"),
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    category: "monospace",
    cssFamily:
      '"JetBrains Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, Monaco, monospace',
    load: () => import("./jetbrains-mono.css"),
  },
  {
    id: "montserrat",
    label: "Montserrat",
    category: "display",
    cssFamily: '"Montserrat Variable", var(--font-ui)',
    load: () => import("./montserrat.css"),
  },
  {
    id: "raleway",
    label: "Raleway",
    category: "display",
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
    id: "serif",
    label: "Serif (Generic)",
    category: "serif",
    cssFamily:
      'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif',
    load: async () => undefined,
  },
  {
    id: "monospace",
    label: "Monospace (Generic)",
    category: "monospace",
    cssFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, Monaco, monospace',
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
    const primaryFace = entry.cssFamily.split(",")[0]?.replace(/"/g, "").trim();
    if (primaryFace && !primaryFace.startsWith("var(")) {
      try {
        await Promise.allSettled([
          document.fonts.load(`400 1em "${primaryFace}"`),
          document.fonts.load(`italic 400 1em "${primaryFace}"`),
          document.fonts.load(`700 1em "${primaryFace}"`),
        ]);
      } catch {
        // Fallback gracefully without breaking rendering
      }
    }
  }
  return entry;
}
