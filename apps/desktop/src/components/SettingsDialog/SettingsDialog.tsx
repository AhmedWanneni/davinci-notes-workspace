import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { openVaultFromPicker } from "../../vault";
import type {
  ThemeDiscoveryError,
  ThemeLifecycleManager,
  ThemeRecord,
} from "../../themes";
import type { SyncMode } from "../SyncSettingsPanel";
import { SettingsSidebar, type SettingsTabId } from "./SettingsSidebar";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { EditorSettingsTab } from "./EditorSettingsTab";
import { AppearanceSettingsTab } from "./AppearanceSettingsTab";
import { FilesLinksSettingsTab } from "./FilesLinksSettingsTab";
import { SyncSettingsTab } from "./SyncSettingsTab";
import { PluginsSettingsTab } from "./PluginsSettingsTab";
import { ClipperSettingsSection } from "./ClipperSettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { LogsSettingsTab } from "./LogsSettingsTab";
import styles from "./SettingsDialog.module.scss";

const LazyAISettingsPanel = React.lazy(() =>
  import("../AISettingsPanel").then((m) => ({ default: m.AISettingsPanel })),
);
const LazyGoogleCalendarSettingsTab = React.lazy(() =>
  import("./GoogleCalendarSettingsTab").then((m) => ({
    default: m.GoogleCalendarSettingsTab,
  })),
);
const LazyNotificationsSettingsTab = React.lazy(() =>
  import("./NotificationsSettingsTab").then((m) => ({
    default: m.NotificationsSettingsTab,
  })),
);

const KNOWN_TABS = new Set([
  "general",
  "appearance",
  "editor",
  "files",
  "sync",
  "notifications",
  "calendar",
  "ai",
  "plugins",
  "web-clipper",
  "logs",
]);

export interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vaultPath: string | null;
  onVaultSwitched: (newPath: string) => void;
  syncMode?: SyncMode;
  onSelectSyncMode?: (mode: SyncMode) => void;
  driveAccountEmail?: string | null;
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
  lastSyncedAt?: number | null;
  syncError?: string | null;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  onDriveSyncNow?: () => void;
  onOpenConflictsPanel?: () => void;
  themes: ThemeRecord[];
  activeThemeId: string | null;
  themeDiscoveryErrors: ThemeDiscoveryError[];
  onActivateTheme: (themeId: string | null) => void | Promise<void>;
  themeManager: ThemeLifecycleManager | null;
  onReloadThemes: () => Promise<void>;
  onActivateThemeFromBrowser: (themeId: string) => Promise<void>;
  log?: string[];
  initialTab?: SettingsTabId;
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  vaultPath,
  onVaultSwitched,
  syncMode = "off",
  onSelectSyncMode,
  driveAccountEmail,
  isDriveSignedIn = false,
  isDriveSyncing = false,
  lastSyncedAt,
  syncError,
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onDriveSyncNow,
  onOpenConflictsPanel,
  themes,
  activeThemeId,
  themeDiscoveryErrors,
  onActivateTheme,
  themeManager,
  onReloadThemes,
  onActivateThemeFromBrowser,
  log = [],
  initialTab = "general",
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleSwitchVault = async () => {
    try {
      const newPath = await openVaultFromPicker();
      if (newPath) onVaultSwitched(newPath);
    } catch (err) {
      console.error("Failed to switch vault:", err);
    }
  };

  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).filter(Boolean).pop() || "Vault"
    : "Vault";
  const windowTitle = `Settings - ${vaultName} - Sophia 0.1.0`;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles["settings-dialog-overlay"]} />
        <DialogPrimitive.Content
          className={styles["settings-dialog-root"]}
          aria-label="Settings"
        >
          <div className={styles["settings-window-header"]}>
            <div className={styles["settings-traffic-lights"]}>
              <button
                type="button"
                className={`${styles["traffic-dot"]} ${styles["traffic-dot--close"]}`}
                onClick={() => onOpenChange(false)}
                aria-label="Close settings"
              />
              <span className={`${styles["traffic-dot"]} ${styles["traffic-dot--minimize"]}`} />
              <span className={`${styles["traffic-dot"]} ${styles["traffic-dot--maximize"]}`} />
            </div>
            <div className={styles["settings-window-title"]}>{windowTitle}</div>
            <div className={styles["settings-header-spacer"]} />
          </div>

          <div className={styles["settings-body"]}>
            <SettingsSidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <main className={styles["settings-main"]} tabIndex={-1}>
              {activeTab === "general" && (
                <GeneralSettingsTab
                  vaultPath={vaultPath}
                  onSwitchVault={() => void handleSwitchVault()}
                />
              )}
              {activeTab === "appearance" && (
                <AppearanceSettingsTab
                  themes={themes}
                  activeThemeId={activeThemeId}
                  discoveryErrors={themeDiscoveryErrors}
                  onActivateTheme={onActivateTheme}
                  vaultPath={vaultPath}
                  themeManager={themeManager}
                  onReloadThemes={onReloadThemes}
                  onActivateThemeFromBrowser={onActivateThemeFromBrowser}
                />
              )}
              {activeTab === "editor" && <EditorSettingsTab />}
              {activeTab === "files" && <FilesLinksSettingsTab />}
              {activeTab === "sync" && (
                <SyncSettingsTab
                  syncMode={syncMode}
                  onSelectSyncMode={onSelectSyncMode}
                  driveAccountEmail={driveAccountEmail}
                  isDriveSignedIn={isDriveSignedIn}
                  isDriveSyncing={isDriveSyncing}
                  lastSyncedAt={lastSyncedAt}
                  syncError={syncError}
                  onDriveSignIn={onDriveSignIn}
                  onDriveDisconnect={onDriveDisconnect}
                  onDriveRefresh={onDriveRefresh}
                  onDriveSyncNow={onDriveSyncNow}
                  vaultPath={vaultPath}
                  onOpenConflictsPanel={onOpenConflictsPanel}
                />
              )}
              {activeTab === "notifications" && (
                <div className={styles["settings-tab-content"]}>
                  <React.Suspense fallback={<div>Loading Notification Settings...</div>}>
                    <LazyNotificationsSettingsTab />
                  </React.Suspense>
                </div>
              )}
              {activeTab === "calendar" && (
                <div className={styles["settings-tab-content"]}>
                  <React.Suspense fallback={<div>Loading Calendar Settings...</div>}>
                    <LazyGoogleCalendarSettingsTab />
                  </React.Suspense>
                </div>
              )}
              {activeTab === "ai" && (
                <div className={styles["settings-tab-content"]}>
                  <React.Suspense fallback={<div>Loading AI Settings...</div>}>
                    <LazyAISettingsPanel />
                  </React.Suspense>
                </div>
              )}
              {activeTab === "plugins" && <PluginsSettingsTab vaultPath={vaultPath} />}
              {activeTab === "web-clipper" && <ClipperSettingsSection />}
              {activeTab === "logs" && <LogsSettingsTab log={log} />}

              {!KNOWN_TABS.has(activeTab) && (
                <div className={styles["settings-tab-content"]}>
                  <SettingsCard
                    title={activeTab
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  >
                    <SettingsRow
                      title="Plugin Options"
                      description={`Configure settings for the ${activeTab} feature.`}
                    >
                      <button type="button" className={styles["settings-select"]} disabled>
                        Active
                      </button>
                    </SettingsRow>
                  </SettingsCard>
                </div>
              )}
            </main>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
