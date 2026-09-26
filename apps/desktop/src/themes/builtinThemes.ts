import type { ThemeManifest } from "@app/theme-api";
import type { ThemeRecord } from "./themeTypes";

import catppuccinFrappeManifest from "../../../../packages/builtin-themes/catppuccin-frappe/manifest.json";
import catppuccinLatteManifest from "../../../../packages/builtin-themes/catppuccin-latte/manifest.json";
import darkBManifest from "../../../../packages/builtin-themes/dark-b/manifest.json";
import lightAManifest from "../../../../packages/builtin-themes/light-a/manifest.json";

interface BuiltinDefinition {
  manifest: ThemeManifest;
  loadStyles: () => Promise<string>;
}

const definitions: BuiltinDefinition[] = [
  {
    manifest: lightAManifest,
    loadStyles: async () =>
      (
        await import("../../../../packages/builtin-themes/light-a/theme.css?raw")
      ).default,
  },
  {
    manifest: catppuccinLatteManifest,
    loadStyles: async () =>
      (
        await import("../../../../packages/builtin-themes/catppuccin-latte/theme.css?raw")
      ).default,
  },
  {
    manifest: catppuccinFrappeManifest,
    loadStyles: async () =>
      (
        await import("../../../../packages/builtin-themes/catppuccin-frappe/theme.css?raw")
      ).default,
  },
  {
    manifest: darkBManifest,
    loadStyles: async () =>
      (await import("../../../../packages/builtin-themes/dark-b/theme.css?raw"))
        .default,
  },
];

export function createBuiltinThemes(): ThemeRecord[] {
  return definitions.map(({ manifest, loadStyles }) => ({
    id: manifest.id,
    manifest,
    dirName: manifest.id,
    source: "builtin",
    loadStyles,
  }));
}
