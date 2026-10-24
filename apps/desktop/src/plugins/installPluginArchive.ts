import {
  checkAppCompatibility,
  validatePluginManifest,
  type PluginManifest,
} from "@app/plugin-api";
import { getPlatformAdapters } from "@app/platform-adapters";
import type { ResolvedPluginRelease } from "./pluginRegistry";
import { unzipPluginArchive } from "./unzipPlugin";

function safePluginId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/u.test(id))
    throw new Error(`Invalid plugin ID: ${id}`);
}

export async function installPluginArchive(
  vaultPath: string,
  release: ResolvedPluginRelease,
  bytes: Uint8Array,
  currentAppVersion: string,
): Promise<PluginManifest> {
  safePluginId(release.entry.id);
  const entries = await unzipPluginArchive(bytes);
  const manifest = readArchiveManifest(entries);
  if (manifest.id !== release.entry.id)
    throw new Error("Plugin manifest ID does not match registry entry");
  if (manifest.version !== release.version)
    throw new Error("Plugin manifest version does not match release metadata");
  const compatibility = checkAppCompatibility(
    manifest.minAppVersion,
    currentAppVersion,
  );
  if (!compatibility.compatible)
    throw new Error(compatibility.reason ?? "Plugin is incompatible");
  if (!entries.some((entry) => entry.path === manifest.main))
    throw new Error(`Plugin archive is missing ${manifest.main}`);
  return await writePluginFiles(vaultPath, release, entries, manifest);
}

export async function inspectPluginArchive(
  bytes: Uint8Array,
): Promise<PluginManifest> {
  return readArchiveManifest(await unzipPluginArchive(bytes));
}

function readArchiveManifest(
  entries: Awaited<ReturnType<typeof unzipPluginArchive>>,
): PluginManifest {
  const manifestEntry = entries.find((entry) => entry.path === "manifest.json");
  if (!manifestEntry)
    throw new Error("Plugin archive is missing root manifest.json");
  const raw = JSON.parse(
    new TextDecoder().decode(manifestEntry.data),
  ) as unknown;
  const result = validatePluginManifest(raw);
  if (!result.success)
    throw new Error(
      result.errors
        .map((error) => `${error.field}: ${error.message}`)
        .join("; "),
    );
  return result.data;
}

async function writePluginFiles(
  vaultPath: string,
  release: ResolvedPluginRelease,
  entries: Awaited<ReturnType<typeof unzipPluginArchive>>,
  manifest: PluginManifest,
): Promise<PluginManifest> {
  const { fs } = getPlatformAdapters();
  const root = `${vaultPath}/.davinci/plugins`;
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

export async function uninstallPlugin(
  vaultPath: string,
  pluginId: string,
): Promise<void> {
  safePluginId(pluginId);
  await getPlatformAdapters().fs.remove(
    `${vaultPath}/.davinci/plugins/${pluginId}`,
  );
}
