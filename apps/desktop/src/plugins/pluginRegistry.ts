export interface PluginRegistryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  artifact?: string;
}

export interface ThemeRegistryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  artifact?: string;
}

export type RegistryEntry = PluginRegistryEntry | ThemeRegistryEntry;

export interface PluginRegistryDocument {
  schemaVersion: 1;
  plugins: PluginRegistryEntry[];
  themes: ThemeRegistryEntry[];
}

export interface GithubRelease {
  version: string;
  tag: string;
  assetUrl: string;
}

export interface ResolvedPluginRelease {
  entry: PluginRegistryEntry;
  version: string;
  minAppVersion: string;
  downloadUrl: string;
}

export interface RegistryHttpClient {
  getJson<T>(url: string): Promise<T>;
  getBytes(url: string): Promise<Uint8Array>;
}

export function parseRegistryDocument(raw: unknown): PluginRegistryDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Registry response is not an object");
  const document = raw as Partial<PluginRegistryDocument>;
  if (document.schemaVersion !== 1 || !Array.isArray(document.plugins))
    throw new Error("Unsupported plugin registry format");
  const themes = Array.isArray(document.themes) ? document.themes : [];
  for (const entry of [...document.plugins, ...themes]) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !entry.id ||
      !entry.repo?.startsWith("https://github.com/")
    ) {
      throw new Error("Registry entry has invalid id or repository URL");
    }
  }
  return { ...document, themes } as PluginRegistryDocument;
}

export function parseGithubReleases(
  raw: unknown,
  artifact: string,
): GithubRelease[] {
  if (!Array.isArray(raw))
    throw new Error("GitHub releases response is invalid");
  return raw.flatMap((release) => {
    if (!release || typeof release !== "object") return [];
    const value = release as {
      tag_name?: unknown;
      assets?: Array<{ name?: unknown; browser_download_url?: unknown }>;
    };
    const asset = value.assets?.find((item) => item.name === artifact);
    return typeof value.tag_name === "string" &&
      typeof asset?.browser_download_url === "string"
      ? [
          {
            version: value.tag_name.replace(/^v/u, ""),
            tag: value.tag_name,
            assetUrl: asset.browser_download_url,
          },
        ]
      : [];
  });
}
