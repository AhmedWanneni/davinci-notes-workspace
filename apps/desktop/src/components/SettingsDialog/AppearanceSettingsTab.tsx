import { useState } from "react";
import { Typography } from "@app/design-system";
import {
  type ThemeDiscoveryError,
  type ThemeLifecycleManager,
  type ThemeRecord,
  ACCENT_COLOR_PRESETS,
  DEFAULT_ACCENT_COLOR,
  applyAccentColor,
  loadSavedAccentColor,
  saveAccentColor,
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
  const [currentAccent, setCurrentAccent] = useState<string>(
    () => loadSavedAccentColor() ?? DEFAULT_ACCENT_COLOR,
  );

  const handleSelectAccent = (color: string) => {
    setCurrentAccent(color);
    saveAccentColor(color);
    applyAccentColor(color);
  };

  const handleResetAccent = () => {
    setCurrentAccent(DEFAULT_ACCENT_COLOR);
    saveAccentColor(null);
    applyAccentColor(null);
  };

  const builtins = themes.filter((theme) => theme.source === "builtin");
  const vaultThemes = themes.filter((theme) => theme.source !== "builtin");

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Appearance">
        <SettingsRow
          title="Accent Color"
          description="Choose a primary accent color for active states, highlights, and controls."
        >
          <div className={styles["accent-picker"]} role="group" aria-label="Accent Color Picker">
            {ACCENT_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles["accent-swatch"]}
                style={{ backgroundColor: preset.value }}
                data-selected={currentAccent.toLowerCase() === preset.value.toLowerCase() || undefined}
                onClick={() => handleSelectAccent(preset.value)}
                aria-label={`Accent ${preset.label}`}
                title={preset.label}
              />
            ))}
            <input
              type="color"
              className={styles["accent-color-input"]}
              value={currentAccent}
              onChange={(e) => handleSelectAccent(e.target.value)}
              aria-label="Custom accent color"
              title="Custom color"
            />
            {currentAccent.toLowerCase() !== DEFAULT_ACCENT_COLOR.toLowerCase() && (
              <button
                type="button"
                className={styles["accent-reset-btn"]}
                onClick={handleResetAccent}
              >
                Reset
              </button>
            )}
          </div>
        </SettingsRow>
      </SettingsCard>

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
            {builtins.length > 0 && (
              <optgroup label="Built-in themes">
                {builtins.map((theme) => (
                  <option value={theme.id} key={theme.id}>
                    {theme.manifest.name}
                  </option>
                ))}
              </optgroup>
            )}
            {vaultThemes.length > 0 && (
              <optgroup label="Vault themes">
                {vaultThemes.map((theme) => (
                  <option value={theme.id} key={theme.id}>
                    {theme.manifest.name}
                  </option>
                ))}
              </optgroup>
            )}
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
