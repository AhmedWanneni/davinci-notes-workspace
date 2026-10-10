import { useEffect } from "react";
import { usePluginStore } from "../../state/usePluginStore";
import { PluginSettingsList } from "../PluginSettingsList";
import { PluginBrowser } from "../PluginBrowser";
import { SettingsCard } from "./SettingsCard";
import styles from "./SettingsDialog.module.scss";

interface PluginsSettingsTabProps {
  vaultPath: string | null;
}

export function PluginsSettingsTab({ vaultPath }: PluginsSettingsTabProps) {
  const plugins = usePluginStore((state) => state.plugins);
  const discoveryErrors = usePluginStore((state) => state.discoveryErrors);
  const settingsTabs = usePluginStore((state) => state.settingsTabs);
  const togglePlugin = usePluginStore((state) => state.togglePlugin);
  const pluginManager = usePluginStore((state) => state.pluginManager);
  const initPlugins = usePluginStore((state) => state.initPlugins);
  const loadPluginRuntime = usePluginStore((state) => state.loadPluginRuntime);

  useEffect(() => {
    void loadPluginRuntime(vaultPath);
  }, [loadPluginRuntime, vaultPath]);

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Installed Plugins">
        <PluginSettingsList
          plugins={plugins}
          discoveryErrors={discoveryErrors}
          settingsTabs={settingsTabs}
          onTogglePlugin={togglePlugin}
        />
      </SettingsCard>

      {pluginManager && vaultPath && (
        <SettingsCard title="Community Plugin Directory">
          <PluginBrowser
            vaultPath={vaultPath}
            manager={pluginManager}
            onReload={() => initPlugins(vaultPath)}
          />
        </SettingsCard>
      )}
    </div>
  );
}
