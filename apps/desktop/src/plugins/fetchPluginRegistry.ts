import {
  parseGithubReleases,
  parseRegistryDocument,
  type PluginRegistryEntry,
  type RegistryEntry,
  type RegistryHttpClient,
  type ResolvedPluginRelease,
} from "./pluginRegistry";
import { resolvePluginRelease } from "./resolvePluginRelease";
import type { VersionCompatibilityMap } from "@app/plugin-api";

export const DEFAULT_PLUGIN_REGISTRY_URL =
  "https://raw.githubusercontent.com/AhmedWanneni/davinci-notes-plugins/main/plugins.json";

export const httpClient: RegistryHttpClient = {
  async getJson<T>(url: string) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(`Registry request failed (${response.status})`);
    return response.json() as Promise<T>;
  },
  async getBytes(url) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Release download failed (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  },
};

export async function fetchPluginRegistry(
  client: RegistryHttpClient,
  url = DEFAULT_PLUGIN_REGISTRY_URL,
) {
  return parseRegistryDocument(await client.getJson<unknown>(url));
}

export async function resolveLatestPluginRelease(
  client: RegistryHttpClient,
  entry: PluginRegistryEntry,
  currentAppVersion: string,
): Promise<ResolvedPluginRelease | null> {
  return resolveLatestRegistryRelease(client, entry, currentAppVersion);
}

export async function resolveLatestRegistryRelease(
  client: RegistryHttpClient,
  entry: RegistryEntry,
  currentAppVersion: string,
) {
  const parts = new URL(entry.repo).pathname.split("/").filter(Boolean);
  if (parts.length !== 2)
    throw new Error(`Invalid GitHub repository: ${entry.repo}`);
  const repo = `${parts[0]}/${parts[1]}`;
  const artifact = entry.artifact ?? `${entry.id}.zip`;
  const [rawReleases, versions] = await Promise.all([
    client.getJson<unknown>(`https://api.github.com/repos/${repo}/releases`),
    client.getJson<VersionCompatibilityMap>(
      `https://raw.githubusercontent.com/${repo}/HEAD/versions.json`,
    ),
  ]);
  return resolvePluginRelease(
    entry,
    parseGithubReleases(rawReleases, artifact),
    versions,
    currentAppVersion,
  );
}
