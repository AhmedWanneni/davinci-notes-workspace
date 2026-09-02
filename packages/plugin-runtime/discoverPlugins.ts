import { validatePluginManifest } from "@app/plugin-api";
import type {
  PluginDiscoveryError,
  PluginFileSystemAdapter,
  PluginRecord,
} from "./pluginTypes.js";

export interface DiscoveryResult {
  plugins: Map<string, PluginRecord>;
  discoveryErrors: PluginDiscoveryError[];
}

/**
 * Scans the local plugins directory for installed plugins, validates each manifest,
 * and detects ID collisions without crashing the discovery process.
 */
export async function discoverPlugins(
  fsAdapter: PluginFileSystemAdapter,
): Promise<DiscoveryResult> {
  const plugins = new Map<string, PluginRecord>();
  const discoveryErrors: PluginDiscoveryError[] = [];

  let directories: string[] = [];
  try {
    directories = await fsAdapter.listPluginDirectories();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    discoveryErrors.push({
      dirName: ".",
      error: `Failed to list plugin root directory: ${message}`,
    });
    return { plugins, discoveryErrors };
  }

  for (const dirName of directories) {
    let rawManifestText = "";
    try {
      rawManifestText = await fsAdapter.readPluginFile(
        dirName,
        "manifest.json",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      discoveryErrors.push({
        dirName,
        error: `Could not read manifest.json: ${message}`,
      });
      continue;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawManifestText);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      discoveryErrors.push({
        dirName,
        error: `Invalid JSON syntax in manifest.json: ${message}`,
      });
      continue;
    }

    const validationResult = validatePluginManifest(parsedJson);
    if (!validationResult.success) {
      const errSummary = validationResult.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ");
      discoveryErrors.push({
        dirName,
        error: `Manifest validation failed: ${errSummary}`,
        validationErrors: validationResult.errors,
      });
      continue;
    }

    const manifest = validationResult.data;

    // Detect ID collision
    const existing = plugins.get(manifest.id);
    if (existing) {
      discoveryErrors.push({
        dirName,
        error: `Plugin ID collision: ID "${manifest.id}" in folder "${dirName}" was already registered by folder "${existing.dirName}". Skipping duplicate.`,
      });
      continue;
    }

    plugins.set(manifest.id, {
      id: manifest.id,
      manifest,
      dirName,
      status: "disabled",
      instance: null,
    });
  }

  return { plugins, discoveryErrors };
}
