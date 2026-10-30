import React, { useEffect, useState } from "react";
import type { CalendarListEntry } from "@app/google-calendar-api";
import { GoogleCalendarClient } from "@app/google-calendar-api";
import {
  loadCalendarToken,
  signInToCalendar,
  disconnectCalendar,
} from "../../calendar/desktopCalendarAuth";
import {
  getCalendarClientId,
  setDynamicCalendarClientId,
} from "../../calendar/calendarAuthConfig";
import {
  getCalendarsFromDb,
  saveCalendarsToDb,
  updateCalendarSelectedInDb,
  purgeCalendarCache,
} from "../../calendar/sqliteCalendarStore";
import { flushAndSyncCalendar } from "../../calendar/calendarSyncRunner";
import { getVaultIndexDb } from "../../vault/sqliteIndex";
import { getSetting, setSetting } from "../../vault/settingsCommands";
import { GoogleAccountCard } from "./GoogleAccountCard";
import { CalendarPreferencesCard } from "./CalendarPreferencesCard";
import { VisibleCalendarsCard } from "./VisibleCalendarsCard";
import styles from "./SettingsDialog.module.scss";

export interface GoogleCalendarSettingsTabProps {
  onStatusChange?: () => void;
}

export function GoogleCalendarSettingsTab({
  onStatusChange,
}: GoogleCalendarSettingsTabProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [clientId, setClientId] = useState(getCalendarClientId() ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        const [savedInterval, savedFolder, savedDeclined, savedClientId] =
          await Promise.all([
            getSetting(db, "calendar.refreshInterval"),
            getSetting(db, "calendar.meetingsFolder"),
            getSetting(db, "calendar.showDeclined"),
            getSetting(db, "calendar.clientId"),
          ]);
        if (mounted) {
          if (savedInterval) setRefreshInterval(savedInterval);
          if (savedFolder) setMeetingsFolder(savedFolder);
          if (savedDeclined) setShowDeclined(savedDeclined === "true");
          if (savedClientId) {
            setClientId(savedClientId);
            setDynamicCalendarClientId(savedClientId);
          }
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

  const updateDbSetting = async (key: string, val: string) => {
    const db = await getVaultIndexDb();
    await setSetting(db, key, val);
  };

  const handleClientIdChange = (val: string) => {
    setClientId(val);
    setErrorMessage(null);
    setDynamicCalendarClientId(val);
    void updateDbSetting("calendar.clientId", val);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const token = await signInToCalendar(undefined, undefined, clientId);
      setIsConnected(true);
      const remoteCals = await new GoogleCalendarClient().listCalendars(
        token.accessToken,
      );
      await saveCalendarsToDb(remoteCals);
      setCalendars(remoteCals);
      await flushAndSyncCalendar();
      window.dispatchEvent(new Event("davinci:calendar-updated"));
      onStatusChange?.();
    } catch (err) {
      console.error("[calendar-settings] Sign in failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Sign-in failed");
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
      setErrorMessage(null);
      window.dispatchEvent(new Event("davinci:calendar-updated"));
      onStatusChange?.();
    } catch (err) {
      console.error("[calendar-settings] Disconnect failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Disconnect failed");
    }
  };

  const handleToggleCalendar = async (id: string, selected: boolean) => {
    await updateCalendarSelectedInDb(id, selected);
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected } : c)),
    );
    window.dispatchEvent(new Event("davinci:calendar-updated"));
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
      <GoogleAccountCard
        isConnected={isConnected}
        isConnecting={isConnecting}
        isLoading={isLoading}
        clientId={clientId}
        errorMessage={errorMessage}
        onClientIdChange={handleClientIdChange}
        onConnect={() => void handleConnect()}
        onDisconnect={() => void handleDisconnect()}
      />

      {isConnected && (
        <VisibleCalendarsCard
          calendars={calendars}
          onToggleCalendar={(id, selected) => {
            void handleToggleCalendar(id, selected);
          }}
        />
      )}

      <CalendarPreferencesCard
        refreshInterval={refreshInterval}
        meetingsFolder={meetingsFolder}
        showDeclined={showDeclined}
        onIntervalChange={handleIntervalChange}
        onMeetingsFolderChange={handleMeetingsFolderChange}
        onToggleDeclined={handleToggleDeclined}
      />
    </div>
  );
}
