import { validateThemeManifest, type ThemeManifest } from "@app/theme-api";
import { checkAppCompatibility } from "@app/plugin-api";
import { getPlatformAdapters } from "@app/platform-adapters";
import type { ResolvedPluginRelease } from "../plugins/pluginRegistry";
import { unzipPluginArchive } from "../plugins/unzipPlugin";

function safeThemeId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/u.test(id)) throw new Error(`Invalid theme ID: ${id}`);
}

export async function inspectThemeArchive(
  bytes: Uint8Array,
): Promise<ThemeManifest> {
  return (await readThemeArchive(bytes)).manifest;
}

async function readThemeArchive(bytes: Uint8Array) {
  const entries = await unzipPluginArchive(bytes);
  const manifestEntry = entries.find((entry) => entry.path === "manifest.json");
  if (!manifestEntry)
    throw new Error("Theme archive is missing root manifest.json");
  const result = validateThemeManifest(
    JSON.parse(new TextDecoder().decode(manifestEntry.data)) as unknown,
  );
  if (!result.success)
    throw new Error(
      result.errors
        .map((error) => `${error.field}: ${error.message}`)
        .join("; "),
    );
  return { entries, manifest: result.data };
}

export async function installThemeArchive(
  vaultPath: string,
  release: ResolvedPluginRelease,
  bytes: Uint8Array,
  currentAppVersion: string,
): Promise<ThemeManifest> {
  const { entries, manifest } = await readThemeArchive(bytes);
  safeThemeId(release.entry.id);
  if (manifest.id !== release.entry.id)
    throw new Error("Theme manifest ID does not match registry entry");
  if (manifest.version !== release.version)
    throw new Error("Theme manifest version does not match release metadata");
  const compatibility = checkAppCompatibility(
    manifest.minAppVersion,
    currentAppVersion,
  );
  if (!compatibility.compatible)
    throw new Error(compatibility.reason ?? "Theme is incompatible");
  if (!entries.some((entry) => entry.path === manifest.styles))
    throw new Error(`Theme archive is missing ${manifest.styles}`);
  const { fs } = getPlatformAdapters();
  const root = `${vaultPath}/.davinci/themes`;
  const target = `${root}/${manifest.id}`;
  const staging = `${root}/.install-${manifest.id}`;
  await fs.remove(staging).catch(() => undefined);
  await fs.mkdir(staging);
  try {
    for (const entry of entries) {
      if (entry.path.includes("..") || entry.path.startsWith("/"))
        throw new Error(`Unsafe archive path: ${entry.path}`);
      const destination = `${staging}/${entry.path}`;
      const parent = destination.slice(0, destination.lastIndexOf("/"));
      if (parent) await fs.mkdir(parent);
      await fs.writeFile(destination, entry.data);
    }
    await fs.remove(target).catch(() => undefined);
    await fs.mkdir(target);
    for (const entry of entries) {
      const destination = `${target}/${entry.path}`;
      const parent = destination.slice(0, destination.lastIndexOf("/"));
      if (parent) await fs.mkdir(parent);
      await fs.writeFile(destination, entry.data);
    }
  } finally {
    await fs.remove(staging).catch(() => undefined);
  }
  return manifest;
}

export async function uninstallTheme(
  vaultPath: string,
  themeId: string,
): Promise<void> {
  safeThemeId(themeId);
  await getPlatformAdapters().fs.remove(
    `${vaultPath}/.davinci/themes/${themeId}`,
  );
}
