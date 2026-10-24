import type { EditorFont } from "@app/editor";

export interface FontOption {
  value: EditorFont;
  label: string;
}

export interface FontGroup {
  label?: string;
  options: FontOption[];
}

export const FONT_GROUPS: FontGroup[] = [
  {
    options: [{ value: "system", label: "System default" }],
  },
  {
    label: "Sans",
    options: [
      { value: "inter", label: "Inter" },
      { value: "ibm-plex-sans", label: "IBM Plex Sans" },
    ],
  },
  {
    label: "Serif",
    options: [
      { value: "literata", label: "Literata" },
      { value: "source-serif-4", label: "Source Serif 4" },
    ],
  },
  {
    label: "Monospace",
    options: [{ value: "jetbrains-mono", label: "JetBrains Mono" }],
  },
  {
    label: "Display",
    options: [
      { value: "montserrat", label: "Montserrat" },
      { value: "raleway", label: "Raleway" },
    ],
  },
  {
    label: "Custom",
    options: [{ value: "custom", label: "Custom font" }],
  },
];
