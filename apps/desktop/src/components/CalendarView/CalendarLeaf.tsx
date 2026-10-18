import React, { useEffect, useState, useCallback } from "react";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { Button, Typography } from "@app/design-system";
import {
  CalendarCheck,
  ArrowsClockwise,
  Gear,
  X,
  WarningCircle,
} from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import { getEventsFromDb } from "../../calendar/sqliteCalendarStore";
import { DayAgendaView } from "./DayAgendaView";
import styles from "./CalendarView.module.scss";

export interface CalendarLeafProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  onCreateNote?: (event: NormalizedCalendarEvent) => void;
  onSync?: () => Promise<void>;
  eventsOverride?: NormalizedCalendarEvent[]; // for testing/storybook
}

export function CalendarLeaf({
  onClose,
  onOpenSettings,
  onCreateNote,
  onSync,
  eventsOverride,
}: CalendarLeafProps) {
  const [events, setEvents] = useState<NormalizedCalendarEvent[]>(eventsOverride ?? []);
  const [isLoading, setIsLoading] = useState(!eventsOverride);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (eventsOverride) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEventsFromDb();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [eventsOverride]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setError(null);
    try {
      if (onSync) {
        await onSync();
      }
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleJoinMeet = (url: string) => {
    void invoke("open_external_url", { url }).catch((err) => {
      console.error("Failed to open meeting url:", err);
    });
  };

  const todayStr = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className={styles["calendar-leaf"]} data-testid="calendar-leaf">
      <header className={styles["calendar-leaf__header"]}>
        <div className={styles["calendar-leaf__title-group"]}>
          <div className={styles["calendar-leaf__icon-wrapper"]}>
            <CalendarCheck size={20} weight="regular" />
          </div>
          <div>
            <Typography variant="h2" size="sm" weight="semibold" className={styles["calendar-leaf__heading"]}>
              Calendar & Meetings
            </Typography>
            <Typography variant="text" size="xs" color="muted">
              {todayStr}
            </Typography>
          </div>
        </div>

        <div className={styles["calendar-leaf__actions"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleSyncNow()}
            disabled={isSyncing}
            aria-label="Refresh calendar"
            data-testid="calendar-sync-btn"
          >
            <ArrowsClockwise
              size={15}
              weight="bold"
              className={isSyncing ? styles["calendar-leaf__spin"] : undefined}
            />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </Button>

          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              aria-label="Calendar Settings"
            >
              <Gear size={15} weight="regular" />
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close calendar"
            >
              <X size={15} weight="bold" />
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className={styles["calendar-leaf__error"]} data-testid="calendar-leaf-error">
          <WarningCircle size={16} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      <main className={styles["calendar-leaf__body"]}>
        {isLoading ? (
          <div className={styles["agenda-empty"]} data-testid="calendar-loading">
            <Typography variant="text" size="sm" color="muted">
              Loading calendar events...
            </Typography>
          </div>
        ) : (
          <DayAgendaView
            events={events}
            onJoinMeet={handleJoinMeet}
            onCreateNote={onCreateNote}
          />
        )}
      </main>
    </div>
  );
}
