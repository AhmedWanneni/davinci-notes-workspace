import { Typography } from "@app/design-system";
import type {
  ThemeDiscoveryError,
  ThemeLifecycleManager,
  ThemeRecord,
} from "../../themes";
import { ThemeBrowser } from "../ThemeBrowser";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

interface AppearanceSettingsTabProps {
  themes: ThemeRecord[];
  activeThemeId: string | null;
  discoveryErrors?: ThemeDiscoveryError[];
  onActivateTheme: (themeId: string | null) => void | Promise<void>;
  vaultPath: string | null;
  themeManager: ThemeLifecycleManager | null;
  onReloadThemes: () => Promise<void>;
  onActivateThemeFromBrowser: (themeId: string) => Promise<void>;
}

export function AppearanceSettingsTab({
  themes,
  activeThemeId,
  discoveryErrors = [],
  onActivateTheme,
  vaultPath,
  themeManager,
  onReloadThemes,
  onActivateThemeFromBrowser,
}: AppearanceSettingsTabProps) {
  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Themes">
        <SettingsRow
          title="Current Theme"
          description="Select an installed theme to customize the look and feel."
        >
          <select
            className={styles["settings-select"]}
            value={activeThemeId ?? ""}
            onChange={(event) =>
              void onActivateTheme(event.target.value || null)
            }
            aria-label="Current Theme"
          >
            <option value="">Default styling</option>
            {themes.map((theme) => (
              <option value={theme.id} key={theme.id}>
                {theme.manifest.name}
              </option>
            ))}
          </select>
        </SettingsRow>
      </SettingsCard>

      {discoveryErrors.length > 0 && (
        <div className={styles["settings-error-banner"]}>
          {discoveryErrors.map((error) => (
            <Typography
              key={error.dirName}
              variant="text"
              size="xs"
              color="error"
            >
              Skipped theme {error.dirName}: {error.error}
            </Typography>
          ))}
        </div>
      )}

      {themeManager && vaultPath && (
        <SettingsCard title="Community Themes">
          <ThemeBrowser
            vaultPath={vaultPath}
            manager={themeManager}
            onReload={onReloadThemes}
            onActivate={onActivateThemeFromBrowser}
          />
        </SettingsCard>
      )}
    </div>
  );
}
