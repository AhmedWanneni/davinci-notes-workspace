import React, { useEffect, useState, useCallback } from "react";
import type {
  CalendarListItem,
  CreateCalendarEventInput,
  NormalizedCalendarEvent,
} from "@app/google-calendar-api";
import { Button, Typography } from "@app/design-system";
import { CalendarCheck, PlugsConnected, WarningCircle } from "@phosphor-icons/react";
import { getPlatformAdapters, hasPlatformAdapters } from "@app/platform-adapters";
import { getCalendarsFromDb, getEventsFromDb } from "../../calendar/sqliteCalendarStore";
import {
  optimisticCreateEvent,
  optimisticDeleteEvent,
  optimisticUpdateEvent,
} from "../../calendar/calendarOutboxWorker";
import {
  checkCalendarConnected,
  connectGoogleCalendarInteractive,
  flushAndSyncCalendar,
} from "../../calendar/calendarSyncRunner";
import { getVaultRemindersOverlayEvents } from "../../calendar/vaultRemindersOverlay";
import { toGoogleAllDayEnd } from "../../calendar/scheduleXAdapter";
import { createOrOpenMeetingNote } from "../../calendar/createMeetingNote";
import { CalendarToolbar, type CalendarViewMode } from "./CalendarToolbar";
import { ScheduleXCalendar } from "./ScheduleXCalendar";
import { DayAgendaView } from "./DayAgendaView";
import { EventModal } from "./EventModal";
import styles from "./CalendarView.module.scss";

export interface CalendarLeafProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  onCreateNote?: (event: NormalizedCalendarEvent) => void;
  onSync?: () => Promise<void>;
  onConnect?: () => Promise<void> | void;
  isConnectedOverride?: boolean;
  eventsOverride?: NormalizedCalendarEvent[];
  initialView?: CalendarViewMode;
}

function stepDate(isoDate: string, view: CalendarViewMode, dir: 1 | -1): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (view === "month-grid" || view === "month-agenda") d.setMonth(d.getMonth() + dir);
  else if (view === "week") d.setDate(d.getDate() + dir * 7);
  else d.setDate(d.getDate() + dir);
  return d.toISOString().slice(0, 10);
}

const openExternal = (url: string) =>
  void (hasPlatformAdapters()
    ? getPlatformAdapters().externalUrl.openUrl(url)
    : Promise.resolve(window.open(url, "_blank", "noopener,noreferrer")));

export function CalendarLeaf({
  onClose,
  onOpenSettings,
  onCreateNote,
  onSync,
  onConnect,
  isConnectedOverride,
  eventsOverride,
  initialView,
}: CalendarLeafProps) {
  const [events, setEvents] = useState<NormalizedCalendarEvent[]>(eventsOverride ?? []);
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(isConnectedOverride ?? false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [view, setView] = useState<CalendarViewMode>(
    initialView ?? (eventsOverride ? "month-agenda" : "month-grid")
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(!eventsOverride);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NormalizedCalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  const loadEvents = useCallback(async () => {
    const connected =
      isConnectedOverride !== undefined ? isConnectedOverride : await checkCalendarConnected();
    setIsConnected(connected);
    if (eventsOverride) return;
    try {
      setIsLoading(true);
      setError(null);
      let [dbEvents, dbCals] = await Promise.all([
        getEventsFromDb(),
        getCalendarsFromDb().catch(() => []),
      ]);
      if (connected && dbCals.length === 0) {
        await flushAndSyncCalendar((msg) => setError(msg));
        [dbEvents, dbCals] = await Promise.all([
          getEventsFromDb(),
          getCalendarsFromDb().catch(() => []),
        ]);
      }
      const now = new Date();
      const fromIso = new Date(now.getTime() - 30 * 86400_000).toISOString();
      const toIso = new Date(now.getTime() + 60 * 86400_000).toISOString();
      const reminders = await getVaultRemindersOverlayEvents(fromIso, toIso).catch(() => []);
      setCalendars(dbCals);
      setEvents([...dbEvents, ...reminders]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [eventsOverride, isConnectedOverride]);

  useEffect(() => {
    void loadEvents();
    const onRefresh = () => void loadEvents();
    window.addEventListener("davinci:calendar-auth-changed", onRefresh);
    window.addEventListener("davinci:calendar-updated", onRefresh);
    return () => {
      window.removeEventListener("davinci:calendar-auth-changed", onRefresh);
      window.removeEventListener("davinci:calendar-updated", onRefresh);
    };
  }, [loadEvents]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setError(null);
    try {
      if (onSync) await onSync();
      else await flushAndSyncCalendar((msg) => setError(msg));
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);
    try {
      if (onConnect) await onConnect();
      else if (await connectGoogleCalendarInteractive(onOpenSettings)) setIsConnected(true);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Google Calendar");
    } finally {
      setIsConnecting(false);
    }
  };

  const openNewEventModal = (dateStr?: string) => {
    setEditingEvent(null);
    setModalInitialDate(dateStr ?? selectedDate);
    setModalOpen(true);
  };

  const handleSaveEvent = async (calendarId: string, input: CreateCalendarEventInput) => {
    try {
      if (editingEvent && !editingEvent.id.startsWith("reminder_")) await optimisticUpdateEvent(editingEvent, input);
      else await optimisticCreateEvent(calendarId, input);
      setModalOpen(false);
      setEditingEvent(null);
      await loadEvents();
      if (onSync) void onSync();
      else void flushAndSyncCalendar((msg) => setError(msg)).then(() => loadEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  const handleDeleteEvent = async (evt: NormalizedCalendarEvent) => {
    try {
      await optimisticDeleteEvent(evt);
      setModalOpen(false);
      setEditingEvent(null);
      await loadEvents();
      if (onSync) void onSync();
      else void flushAndSyncCalendar((msg) => setError(msg)).then(() => loadEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleReschedule = async (evt: NormalizedCalendarEvent, newStart: string, newEnd: string) => {
    if (evt.id.startsWith("reminder_")) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isAllDay = !newStart.includes(" ");
    const payload = isAllDay
      ? { start: { date: newStart.slice(0, 10) }, end: { date: toGoogleAllDayEnd(newEnd.slice(0, 10)) } }
      : {
          start: { dateTime: new Date(newStart.replace(" ", "T")).toISOString(), timeZone: tz },
          end: { dateTime: new Date(newEnd.replace(" ", "T")).toISOString(), timeZone: tz },
        };
    await optimisticUpdateEvent(evt, payload);
    await loadEvents();
    if (onSync) void onSync();
    else void flushAndSyncCalendar((msg) => setError(msg)).then(() => loadEvents());
  };

  const periodLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(`${selectedDate}T12:00:00`)
  );

  return (
    <div className={styles["calendar-leaf"]} data-testid="calendar-leaf">
      <div className={styles["calendar-leaf__header"]}>
        <div className={styles["calendar-leaf__title-group"]}>
          <div className={styles["calendar-leaf__icon-wrapper"]}><CalendarCheck size={18} weight="regular" /></div>
          <Typography variant="h2" size="sm" weight="semibold" className={styles["calendar-leaf__heading"]}>Calendar & Meetings</Typography>
        </div>
      </div>

      <CalendarToolbar
        currentView={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        onToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
        onPrev={() => setSelectedDate((d) => stepDate(d, view, -1))}
        onNext={() => setSelectedDate((d) => stepDate(d, view, 1))}
        isSyncing={isSyncing}
        onSync={() => void handleSyncNow()}
        onCreateEvent={() => openNewEventModal(selectedDate)}
        onOpenSettings={onOpenSettings}
        onClose={onClose}
      />

      {!isConnected && (
        <div className={styles["calendar-leaf__connect-banner"]} data-testid="calendar-connect-banner">
          <div className={styles["calendar-leaf__connect-info"]}>
            <PlugsConnected size={16} weight="regular" />
            <span>Not connected to Google Calendar — Events are saved locally. Connect your Google account for two-way sync.</span>
          </div>
          <div className={styles["calendar-leaf__connect-actions"]}>
            <Button variant="primary" size="sm" onClick={() => void handleConnect()} disabled={isConnecting} data-testid="calendar-connect-btn">
              <span>{isConnecting ? "Connecting..." : "Connect Google Calendar"}</span>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles["calendar-leaf__error"]} data-testid="calendar-leaf-error">
          <WarningCircle size={16} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      <main className={styles["calendar-leaf__body"]}>
        {isLoading ? (
          <div className={styles["agenda-empty"]} data-testid="calendar-loading">
            <Typography variant="text" size="sm" color="muted">Loading calendar events...</Typography>
          </div>
        ) : view === "month-agenda" ? (
          <DayAgendaView
            events={events}
            onJoinMeet={openExternal}
            onCreateNote={(evt) => void (onCreateNote ? onCreateNote(evt) : createOrOpenMeetingNote(evt))}
            onCreateEvent={() => openNewEventModal(selectedDate)}
          />
        ) : (
          <ScheduleXCalendar
            events={events}
            calendars={calendars}
            selectedDate={selectedDate}
            view={view}
            onSelectEvent={(evt) => { setEditingEvent(evt); setModalOpen(true); }}
            onEventReschedule={(evt, s, e) => void handleReschedule(evt, s, e)}
            onClickDateTime={(dt) => openNewEventModal(dt.slice(0, 10))}
          />
        )}
      </main>

      <EventModal
        isOpen={modalOpen}
        event={editingEvent}
        initialDate={modalInitialDate}
        calendars={calendars}
        onClose={() => setModalOpen(false)}
        onSave={(calId, data) => void handleSaveEvent(calId, data)}
        onDelete={(evt) => void handleDeleteEvent(evt)}
        onJoinMeet={openExternal}
        onCreateNote={(evt) => void (onCreateNote ? onCreateNote(evt) : createOrOpenMeetingNote(evt))}
      />
    </div>
  );
}
