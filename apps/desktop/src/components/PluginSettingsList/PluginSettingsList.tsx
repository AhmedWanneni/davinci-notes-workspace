import type { PluginDiscoveryError, PluginRecord } from "@app/plugin-runtime";
import type { PluginSettingTab } from "@app/plugin-api";
import { Checkbox, Typography } from "@app/design-system";
import styles from "./PluginSettingsList.module.scss";

export interface PluginSettingsListProps {
  plugins: PluginRecord[];
  discoveryErrors?: PluginDiscoveryError[];
  onTogglePlugin: (id: string, enable: boolean) => void | Promise<void>;
  settingsTabs?: PluginSettingTab[];
}

export function PluginSettingsList({
  plugins,
  discoveryErrors = [],
  onTogglePlugin,
  settingsTabs = [],
}: PluginSettingsListProps) {
  return (
    <section
      className={styles.section}
      aria-labelledby="plugins-settings-title"
    >
      <div className={styles.header}>
        <Typography variant="h3" size="sm" id="plugins-settings-title">
          Installed Plugins
        </Typography>
        <Typography variant="text" size="xs" color="muted">
          Manage local plugins located in your vault&apos;s{" "}
          <code>.davinci/plugins/</code> directory.
        </Typography>
      </div>

      {plugins.length === 0 ? (
        <div className={styles["empty-state"]}>
          <Typography variant="text" size="xs" color="muted">
            No plugins found in <code>.davinci/plugins/</code>. Drop a plugin
            folder in to get started.
          </Typography>
        </div>
      ) : (
        <div className={styles.list}>
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={styles.item}
              data-testid={`plugin-item-${plugin.id}`}
            >
              <div className={styles["item-info"]}>
                <div className={styles["title-row"]}>
                  <Typography variant="h3" size="xs">
                    {plugin.manifest.name}
                  </Typography>
                  <span className={styles["version-badge"]}>
                    v{plugin.manifest.version}
                  </span>
                  {plugin.manifest.author && (
                    <Typography variant="text" size="xs" color="muted">
                      by {plugin.manifest.author}
                    </Typography>
                  )}
                </div>
                {plugin.manifest.description && (
                  <Typography variant="text" size="xs" color="muted">
                    {plugin.manifest.description}
                  </Typography>
                )}
                <Typography
                  variant="text"
                  size="xs"
                  color="muted"
                  className={styles["plugin-id"]}
                >
                  ID: {plugin.id}
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Permissions:{" "}
                  {plugin.manifest.permissions?.join(", ") || "none"}
                </Typography>
                {plugin.status === "error" && plugin.error && (
                  <div className={styles["error-box"]} role="alert">
                    <Typography variant="text" size="xs" color="muted">
                      Error: {plugin.error}
                    </Typography>
                  </div>
                )}
              </div>
              <div className={styles["item-control"]}>
                <Checkbox
                  checked={plugin.status === "enabled"}
                  onCheckedChange={(checked) => {
                    void onTogglePlugin(plugin.id, checked === true);
                  }}
                  aria-label={`Enable ${plugin.manifest.name}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {discoveryErrors.map((error) => (
        <div
          key={`${error.dirName}:${error.error}`}
          className={styles["error-box"]}
          role="alert"
        >
          <Typography variant="text" size="xs" color="muted">
            Discovery error in {error.dirName}: {error.error}
          </Typography>
        </div>
      ))}
      {settingsTabs.map((tab) => (
        <section key={tab.id} aria-labelledby={`plugin-tab-${tab.id}`}>
          <Typography variant="h3" size="xs" id={`plugin-tab-${tab.id}`}>
            {tab.title}
          </Typography>
          {tab.fields.map((field) => (
            <Typography key={field.key} variant="text" size="xs" color="muted">
              {field.label}
            </Typography>
          ))}
        </section>
      ))}
    </section>
  );
}
