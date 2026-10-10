import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, Toggle } from "@app/design-system";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

interface GeneralSettingsTabProps {
  vaultPath: string | null;
  onSwitchVault: () => void;
}

export function GeneralSettingsTab({
  vaultPath,
  onSwitchVault,
}: GeneralSettingsTabProps) {
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(false);
  const [language, setLanguage] = useState("en");
  const [keepInTray, setKeepInTray] = useState(true);

  useEffect(() => {
    let mounted = true;
    void invoke<boolean>("get_keep_in_tray")
      .then((val) => {
        if (mounted && typeof val === "boolean") {
          setKeepInTray(val);
        }
      })
      .catch(() => {
        // Fallback default
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleKeepInTray = (enabled: boolean) => {
    setKeepInTray(enabled);
    void invoke("set_keep_in_tray", { enabled }).catch((err) => {
      console.error("Failed to update keep in tray setting", err);
    });
  };

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard>
        <SettingsRow
          title="Version 0.1.0"
          description={
            <>
              Installer version: 0.1.0
              <br />
              <a
                href="#changelog"
                onClick={(e) => e.preventDefault()}
                className={styles["settings-link"]}
              >
                Read the changelog.
              </a>
            </>
          }
        >
          <Button variant="secondary" size="sm">
            Check for updates
          </Button>
        </SettingsRow>

        <SettingsRow
          title="Keep running in menu bar"
          description="When closed, DaVinci Notes will stay open in the menu bar tray."
        >
          <Toggle
            checked={keepInTray}
            onCheckedChange={handleToggleKeepInTray}
            aria-label="Keep running in menu bar"
          />
        </SettingsRow>

        <SettingsRow
          title="Automatic updates"
          description="Turn this off to prevent the app from checking for updates."
        >
          <Toggle
            checked={autoUpdates}
            onCheckedChange={setAutoUpdates}
            aria-label="Automatic updates"
          />
        </SettingsRow>

        <SettingsRow
          title="Receive early access versions"
          description="Auto-update to the latest early access version. These versions include new features but may be less stable."
        >
          <Toggle
            checked={earlyAccess}
            onCheckedChange={setEarlyAccess}
            aria-label="Receive early access versions"
          />
        </SettingsRow>

        <SettingsRow
          title="Language"
          description={
            <>
              Change the display language.
              <br />
              <a
                href="#languages"
                onClick={(e) => e.preventDefault()}
                className={styles["settings-link"]}
              >
                Learn how to add a new language.
              </a>
            </>
          }
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles["settings-select"]}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </SettingsRow>

        <SettingsRow
          title="Help"
          description="Learn how to use Davinci Notes and get help from the community."
        >
          <Button variant="secondary" size="sm">
            Open
          </Button>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Account">
        <SettingsRow
          title="Your account"
          description="You're not logged in right now. An account is only needed for Davinci Sync, Publish, and early access versions."
        >
          <div className={styles["settings-btn-group"]}>
            <Button variant="secondary" size="sm">
              Log in
            </Button>
            <Button variant="secondary" size="sm">
              Sign up
            </Button>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Commercial license"
          description="A commercial license is required to use Davinci Notes for work-related activities in a company with two or more employees."
        >
          <div className={styles["settings-btn-group"]}>
            <Button variant="secondary" size="sm">
              Activate
            </Button>
            <Button variant="secondary" size="sm">
              Purchase
            </Button>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Vault">
        <SettingsRow
          title="Vault Location"
          description={`Current vault path: ${vaultPath || "None"}`}
        >
          <Button variant="secondary" size="sm" onClick={onSwitchVault}>
            Switch Vault
          </Button>
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}
