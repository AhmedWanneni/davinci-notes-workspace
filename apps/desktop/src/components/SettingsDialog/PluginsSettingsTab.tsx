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
  const settingsTabs = usePluginStore((state) => state.settingsTabs);
  const togglePlugin = usePluginStore((state) => state.togglePlugin);
  const pluginManager = usePluginStore((state) => state.pluginManager);
  const initPlugins = usePluginStore((state) => state.initPlugins);

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Installed Plugins">
        <PluginSettingsList
          plugins={plugins}
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
