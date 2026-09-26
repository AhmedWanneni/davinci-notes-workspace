import { Typography } from "@app/design-system";
import type { ThemeDiscoveryError, ThemeRecord } from "../../themes";
import styles from "./ThemeSettingsList.module.scss";

interface ThemeSettingsListProps {
  themes: ThemeRecord[];
  activeThemeId: string | null;
  discoveryErrors?: ThemeDiscoveryError[];
  onActivate: (themeId: string | null) => void | Promise<void>;
}

export function ThemeSettingsList({
  themes,
  activeThemeId,
  discoveryErrors = [],
  onActivate,
}: ThemeSettingsListProps) {
  return (
    <section className={styles.section} aria-labelledby="themes-settings-title">
      <Typography variant="h3" size="sm" id="themes-settings-title">
        Themes
      </Typography>
      <label className={styles.label}>
        <Typography variant="text" size="xs" color="muted">
          Active theme
        </Typography>
        <select
          className={styles.select}
          value={activeThemeId ?? ""}
          onChange={(event) => void onActivate(event.target.value || null)}
        >
          <option value="">Default styling</option>
          {themes.map((theme) => (
            <option value={theme.id} key={theme.id}>
              {theme.manifest.name}
              {theme.source === "builtin" ? " (Built-in)" : ""}
            </option>
          ))}
        </select>
      </label>
      {themes.map((theme) => (
        <div className={styles.item} key={theme.id}>
          <Typography variant="text" size="xs">
            {theme.manifest.name}
          </Typography>
          <Typography variant="text" size="xs" color="muted">
            {theme.id} - v{theme.manifest.version}
            {theme.source === "builtin" ? " - Built-in" : ""}
            {activeThemeId === theme.id ? " - Active" : ""}
          </Typography>
        </div>
      ))}
      {discoveryErrors.map((error) => (
        <Typography key={error.dirName} variant="text" size="xs" color="error">
          Skipped {error.dirName}: {error.error}
        </Typography>
      ))}
    </section>
  );
}
