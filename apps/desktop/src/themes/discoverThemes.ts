import { validateThemeManifest, type ThemeManifest } from "@app/theme-api";
import type {
  ThemeDiscoveryError,
  ThemeFileSystemAdapter,
  ThemeRecord,
} from "./themeTypes";

export interface ThemeDiscoveryResult {
  themes: Map<string, ThemeRecord>;
  errors: ThemeDiscoveryError[];
}

export async function discoverThemes(
  adapter: ThemeFileSystemAdapter | null,
  initialThemes: ThemeRecord[] = [],
): Promise<ThemeDiscoveryResult> {
  const themes = new Map(initialThemes.map((theme) => [theme.id, theme]));
  const errors: ThemeDiscoveryError[] = [];
  if (!adapter) return { themes, errors };
  let directories: string[] = [];
  try {
    directories = await adapter.listThemeDirectories();
  } catch (error) {
    errors.push({
      dirName: "<themes>",
      error: `Could not list themes: ${String(error)}`,
    });
  }
  for (const dirName of directories) {
    try {
      const raw = JSON.parse(
        await adapter.readThemeFile(dirName, "manifest.json"),
      ) as unknown;
      const result = validateThemeManifest(raw);
      if (!result.success)
        throw new Error(
          result.errors
            .map(({ field, message }) => `${field}: ${message}`)
            .join("; "),
        );
      const existing = themes.get(result.data.id);
      if (existing)
        throw new Error(
          existing.source === "builtin"
            ? `Theme ID collision: ${result.data.id}; built-in theme takes precedence.`
            : `Theme ID collision: ${result.data.id}`,
        );
      themes.set(result.data.id, createThemeRecord(dirName, result.data));
    } catch (error) {
      errors.push({
        dirName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { themes, errors };
}

function createThemeRecord(
  dirName: string,
  manifest: ThemeManifest,
): ThemeRecord {
  return { id: manifest.id, manifest, dirName, source: "vault" };
}
