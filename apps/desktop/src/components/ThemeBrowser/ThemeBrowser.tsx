import { useEffect, useMemo, useState } from "react";
import { Button, Typography } from "@app/design-system";
import { checkAppCompatibility } from "@app/plugin-api";
import type { ThemeLifecycleManager } from "../../themes";
import {
  installThemeArchive,
  inspectThemeArchive,
  uninstallTheme,
} from "../../themes/installThemeArchive";
import {
  fetchPluginRegistry,
  httpClient,
  resolveLatestRegistryRelease,
} from "../../plugins/fetchPluginRegistry";
import { isUpdateAvailable } from "../../plugins/resolvePluginRelease";
import type {
  ResolvedPluginRelease,
  ThemeRegistryEntry,
} from "../../plugins/pluginRegistry";
import styles from "./ThemeBrowser.module.scss";

const CURRENT_APP_VERSION = "0.1.0";

interface ThemeBrowserProps {
  vaultPath: string;
  manager: ThemeLifecycleManager;
  onReload: () => Promise<void>;
  onActivate: (themeId: string) => Promise<void>;
}

export function ThemeBrowser({
  vaultPath,
  manager,
  onReload,
  onActivate,
}: ThemeBrowserProps) {
  const [entries, setEntries] = useState<ThemeRegistryEntry[]>([]);
  const [releases, setReleases] = useState<
    Record<string, ResolvedPluginRelease | null>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const installed = useMemo(
    () => new Map(manager.getThemes().map((theme) => [theme.id, theme])),
    [manager],
  );

  useEffect(() => {
    let active = true;
    void fetchPluginRegistry(httpClient)
      .then(async (document) => {
        const resolved = await Promise.all(
          document.themes.map(
            async (entry) =>
              [
                entry.id,
                await resolveLatestRegistryRelease(
                  httpClient,
                  entry,
                  CURRENT_APP_VERSION,
                ),
              ] as const,
          ),
        );
        if (active) {
          setEntries(document.themes);
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

  const resolve = async (entry: ThemeRegistryEntry) => {
    const release = await resolveLatestRegistryRelease(
      httpClient,
      entry,
      CURRENT_APP_VERSION,
    );
    setReleases((current) => ({ ...current, [entry.id]: release }));
    return release;
  };

  const install = async (entry: ThemeRegistryEntry) => {
    const release = releases[entry.id] ?? (await resolve(entry));
    if (!release)
      throw new Error(
        "No compatible release is available for this app version",
      );
    const bytes = await httpClient.getBytes(release.downloadUrl);
    const manifest = await inspectThemeArchive(bytes);
    if (manifest.id !== entry.id || manifest.version !== release.version)
      throw new Error("Theme manifest does not match registry release");
    const compatibility = checkAppCompatibility(
      manifest.minAppVersion,
      CURRENT_APP_VERSION,
    );
    if (!compatibility.compatible)
      throw new Error(compatibility.reason ?? "Theme is incompatible");
    if (
      !window.confirm(
        `Install and activate ${manifest.name} ${manifest.version}?`,
      )
    )
      return;
    await manager.activateTheme(null);
    await installThemeArchive(vaultPath, release, bytes, CURRENT_APP_VERSION);
    await onReload();
    await onActivate(manifest.id);
  };

  const remove = async (entry: ThemeRegistryEntry) => {
    if (!window.confirm(`Uninstall ${entry.name}?`)) return;
    if (manager.getActiveThemeId() === entry.id)
      await manager.activateTheme(null);
    await uninstallTheme(vaultPath, entry.id);
    await onReload();
  };

  const reportActionError = (reason: unknown) =>
    setError(
      `Action failed: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  if (loading)
    return (
      <Typography variant="text" size="xs" color="muted">
        Loading theme registry...
      </Typography>
    );
  if (error)
    return (
      <div className={styles.error} role="alert">
        <Typography variant="text" size="xs">
          {error}. Installed themes remain available.
        </Typography>
      </div>
    );
  return (
    <section className={styles.section} aria-labelledby="theme-browser-title">
      <Typography variant="h3" size="sm" id="theme-browser-title">
        Theme Registry
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="text" size="xs" color="muted">
          No approved themes are listed.
        </Typography>
      ) : (
        entries.map((entry) => {
          const theme = installed.get(entry.id);
          const release = releases[entry.id];
          const update =
            theme &&
            release &&
            isUpdateAvailable(theme.manifest.version, release);
          return (
            <div className={styles.item} key={entry.id}>
              <div>
                <Typography variant="h3" size="xs">
                  {entry.name}
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  {entry.description} by {entry.author}
                </Typography>
                {theme && (
                  <Typography variant="text" size="xs" color="muted">
                    Installed {theme.manifest.version}
                    {update ? `; update ${release.version} available` : ""}
                  </Typography>
                )}
              </div>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  onClick={() => void install(entry).catch(reportActionError)}
                >
                  {theme ? "Update" : "Install"}
                </Button>
                {theme && (
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
