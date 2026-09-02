import { useEffect, useMemo, useState } from "react";
import { Button, Typography } from "@app/design-system";
import type { PluginLifecycleManager } from "@app/plugin-runtime";
import { checkAppCompatibility } from "@app/plugin-api";
import {
  fetchPluginRegistry,
  resolveLatestPluginRelease,
} from "../../plugins/fetchPluginRegistry";
import {
  installPluginArchive,
  inspectPluginArchive,
  uninstallPlugin,
} from "../../plugins/installPluginArchive";
import { isUpdateAvailable } from "../../plugins/resolvePluginRelease";
import type {
  PluginRegistryEntry,
  RegistryHttpClient,
  ResolvedPluginRelease,
} from "../../plugins/pluginRegistry";
import styles from "./PluginBrowser.module.scss";

const CURRENT_APP_VERSION = "0.1.0";
const httpClient: RegistryHttpClient = {
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
      throw new Error(`Plugin download failed (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  },
};

interface PluginBrowserProps {
  vaultPath: string;
  manager: PluginLifecycleManager;
  onReload: () => Promise<void>;
}

export function PluginBrowser({
  vaultPath,
  manager,
  onReload,
}: PluginBrowserProps) {
  const [entries, setEntries] = useState<PluginRegistryEntry[]>([]);
  const [releases, setReleases] = useState<
    Record<string, ResolvedPluginRelease | null>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const installed = useMemo(
    () => new Map(manager.getPlugins().map((plugin) => [plugin.id, plugin])),
    [manager],
  );

  useEffect(() => {
    let active = true;
    void fetchPluginRegistry(httpClient)
      .then(async (document) => {
        const resolved = await Promise.all(
          document.plugins.map(
            async (entry) =>
              [
                entry.id,
                await resolveLatestPluginRelease(
                  httpClient,
                  entry,
                  CURRENT_APP_VERSION,
                ),
              ] as const,
          ),
        );
        if (active) {
          setEntries(document.plugins);
          setReleases(Object.fromEntries(resolved));
          setError(null);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            `Offline: ${reason instanceof Error ? reason.message : String(reason)}`,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const resolve = async (entry: PluginRegistryEntry) => {
    const release = await resolveLatestPluginRelease(
      httpClient,
      entry,
      CURRENT_APP_VERSION,
    );
    setReleases((current) => ({ ...current, [entry.id]: release }));
    return release;
  };

  const install = async (entry: PluginRegistryEntry) => {
    const release = releases[entry.id] ?? (await resolve(entry));
    if (!release)
      throw new Error(
        "No compatible release is available for this app version",
      );
    const bytes = await httpClient.getBytes(release.downloadUrl);
    const manifest = await inspectPluginArchive(bytes);
    if (manifest.id !== entry.id)
      throw new Error("Plugin manifest ID does not match registry entry");
    if (manifest.version !== release.version)
      throw new Error(
        "Plugin manifest version does not match release metadata",
      );
    const compatibility = checkAppCompatibility(
      manifest.minAppVersion,
      CURRENT_APP_VERSION,
    );
    if (!compatibility.compatible)
      throw new Error(compatibility.reason ?? "Plugin is incompatible");
    const permissions = manifest.permissions?.join(", ") || "none";
    if (
      !window.confirm(
        `Install ${manifest.name} ${manifest.version}?\nPermissions: ${permissions}`,
      )
    )
      return;
    await manager.unloadAll();
    await installPluginArchive(vaultPath, release, bytes, CURRENT_APP_VERSION);
    await onReload();
  };

  const remove = async (entry: PluginRegistryEntry) => {
    if (!window.confirm(`Uninstall ${entry.name}?`)) return;
    await manager.disablePlugin(entry.id);
    await uninstallPlugin(vaultPath, entry.id);
    await onReload();
  };

  const reportActionError = (reason: unknown) => {
    setError(
      `Action failed: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  };

  if (loading)
    return (
      <Typography variant="text" size="xs" color="muted">
        Loading plugin registry...
      </Typography>
    );
  if (error)
    return (
      <div className={styles.error} role="alert">
        <Typography variant="text" size="xs">
          {error}. Installed plugins remain available.
        </Typography>
      </div>
    );
  return (
    <section className={styles.section} aria-labelledby="plugin-browser-title">
      <Typography variant="h3" size="sm" id="plugin-browser-title">
        Plugin Registry
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="text" size="xs" color="muted">
          No approved plugins are listed.
        </Typography>
      ) : (
        entries.map((entry) => {
          const plugin = installed.get(entry.id);
          const release = releases[entry.id];
          const update =
            plugin &&
            release &&
            isUpdateAvailable(plugin.manifest.version, release);
          return (
            <div className={styles.item} key={entry.id}>
              <div>
                <Typography variant="h3" size="xs">
                  {entry.name}
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  {entry.description} by {entry.author}
                </Typography>
                {plugin && (
                  <Typography variant="text" size="xs" color="muted">
                    Installed {plugin.manifest.version}
                    {update ? `; update ${release.version} available` : ""}
                  </Typography>
                )}
              </div>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  onClick={() => void install(entry).catch(reportActionError)}
                >
                  {plugin ? "Update" : "Install"}
                </Button>
                {plugin && (
                  <Button
                    variant="secondary"
                    onClick={() => void remove(entry).catch(reportActionError)}
                  >
                    Uninstall
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
