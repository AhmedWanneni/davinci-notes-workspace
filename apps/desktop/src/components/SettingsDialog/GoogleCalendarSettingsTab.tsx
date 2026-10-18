import React, { useEffect, useState } from "react";
import { Button, Toggle } from "@app/design-system";
import type { CalendarListEntry } from "@app/google-calendar-api";
import { listCalendars } from "@app/google-calendar-api";
import {
  loadCalendarToken,
  signInToCalendar,
  disconnectCalendar,
} from "../../calendar/desktopCalendarAuth";
import {
  getCalendarsFromDb,
  saveCalendarsToDb,
  updateCalendarSelectedInDb,
  purgeCalendarCache,
} from "../../calendar/sqliteCalendarStore";
import { getVaultIndexDb } from "../../vault/sqliteIndex";
import { getSetting, setSetting } from "../../vault/settingsCommands";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { VisibleCalendarsCard } from "./VisibleCalendarsCard";
import styles from "./SettingsDialog.module.scss";
import localStyles from "./GoogleCalendarSettingsTab.module.scss";

export interface GoogleCalendarSettingsTabProps {
  onStatusChange?: () => void;
}

export function GoogleCalendarSettingsTab({
  onStatusChange,
}: GoogleCalendarSettingsTabProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);
  const [refreshInterval, setRefreshInterval] = useState("15m");
  const [meetingsFolder, setMeetingsFolder] = useState("Meetings");
  const [showDeclined, setShowDeclined] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const token = await loadCalendarToken();
        if (!mounted) return;
        setIsConnected(!!token);
        if (token) {
          const cals = await getCalendarsFromDb();
          if (mounted) setCalendars(cals);
        }

        const db = await getVaultIndexDb();
        const [savedInterval, savedFolder, savedDeclined] = await Promise.all([
          getSetting(db, "calendar.refreshInterval"),
          getSetting(db, "calendar.meetingsFolder"),
          getSetting(db, "calendar.showDeclined"),
        ]);
        if (mounted) {
          if (savedInterval) setRefreshInterval(savedInterval);
          if (savedFolder) setMeetingsFolder(savedFolder);
          if (savedDeclined) setShowDeclined(savedDeclined === "true");
        }
      } catch {
        // ignore init errors
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const token = await signInToCalendar();
      setIsConnected(true);
      const remoteCals = await listCalendars(token.accessToken);
      await saveCalendarsToDb(remoteCals);
      setCalendars(remoteCals);
      onStatusChange?.();
    } catch (err) {
      console.error("[calendar-settings] Sign in failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectCalendar();
      await purgeCalendarCache();
      setIsConnected(false);
      setCalendars([]);
      onStatusChange?.();
    } catch (err) {
      console.error("[calendar-settings] Disconnect failed:", err);
    }
  };

  const handleToggleCalendar = async (id: string, selected: boolean) => {
    await updateCalendarSelectedInDb(id, selected);
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected } : c)),
    );
  };

  const updateDbSetting = async (key: string, val: string) => {
    const db = await getVaultIndexDb();
    await setSetting(db, key, val);
  };

  const handleIntervalChange = (val: string) => {
    setRefreshInterval(val);
    void updateDbSetting("calendar.refreshInterval", val);
  };

  const handleMeetingsFolderChange = (val: string) => {
    setMeetingsFolder(val);
    void updateDbSetting("calendar.meetingsFolder", val);
  };

  const handleToggleDeclined = (val: boolean) => {
    setShowDeclined(val);
    void updateDbSetting("calendar.showDeclined", String(val));
  };

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Google Account">
        <SettingsRow
          title={isConnected ? "Connected to Google" : "Not Connected"}
          description={
            isConnected
              ? "Your Google Calendar is linked with read-only permissions."
              : "Sign in with Google to view events and join meetings."
          }
        >
          {isConnected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDisconnect()}
              data-testid="disconnect-calendar-btn"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleConnect()}
              disabled={isConnecting || isLoading}
              data-testid="connect-calendar-btn"
            >
              {isConnecting ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          )}
        </SettingsRow>
      </SettingsCard>

      {isConnected && (
        <VisibleCalendarsCard
          calendars={calendars}
          onToggleCalendar={(id, selected) => {
            void handleToggleCalendar(id, selected);
          }}
        />
      )}

      <SettingsCard title="Preferences">
        <SettingsRow
          title="Refresh Cadence"
          description="How often events sync in the background."
        >
          <select
            value={refreshInterval}
            onChange={(e) => void handleIntervalChange(e.target.value)}
            className={localStyles["settings-select"]}
            aria-label="Refresh Cadence"
          >
            <option value="5m">Every 5 minutes</option>
            <option value="15m">Every 15 minutes</option>
            <option value="30m">Every 30 minutes</option>
            <option value="manual">Manual only</option>
          </select>
        </SettingsRow>

        <SettingsRow
          title="Meeting Notes Folder"
          description="Vault folder where new meeting notes are created."
        >
          <input
            type="text"
            value={meetingsFolder}
            onChange={(e) => void handleMeetingsFolderChange(e.target.value)}
            className={localStyles["settings-input"]}
            placeholder="Meetings"
            aria-label="Meeting Notes Folder"
          />
        </SettingsRow>

        <SettingsRow
          title="Show Declined Events"
          description="Display calendar events you declined."
        >
          <Toggle
            checked={showDeclined}
            onCheckedChange={(checked) => void handleToggleDeclined(checked)}
            aria-label="Show Declined Events"
          />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}
