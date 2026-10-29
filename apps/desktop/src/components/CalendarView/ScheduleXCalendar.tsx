import React, { useEffect, useState, useRef } from "react";
import { useCalendarApp, ScheduleXCalendar as SXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
  viewMonthGrid,
  type CalendarAppSingleton,
} from "@schedule-x/calendar";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import type { CalendarListItem, NormalizedCalendarEvent } from "@app/google-calendar-api";
import { toScheduleXEvents } from "../../calendar/scheduleXAdapter";
import styles from "./ScheduleXCalendar.module.scss";

export interface ScheduleXCalendarProps {
  events: NormalizedCalendarEvent[];
  calendars?: CalendarListItem[];
  selectedDate?: string;
  view?: string;
  onSelectEvent?: (event: NormalizedCalendarEvent) => void;
  onEventReschedule?: (
    event: NormalizedCalendarEvent,
    newStart: string,
    newEnd: string,
  ) => void;
  onRangeUpdate?: (range: { start: string; end: string }) => void;
  onClickDateTime?: (dateTimeStr: string) => void;
}

export function ScheduleXCalendar({
  events,
  calendars = [],
  selectedDate,
  view = viewMonthGrid.name,
  onSelectEvent,
  onEventReschedule,
  onRangeUpdate,
  onClickDateTime,
}: ScheduleXCalendarProps) {
  const [eventsService] = useState(() => createEventsServicePlugin());
  const [dragPlugin] = useState(() => createDragAndDropPlugin());
  const appRef = useRef<CalendarAppSingleton | null>(null);

  const eventsRef = useRef<NormalizedCalendarEvent[]>(events);
  eventsRef.current = events;

  const callbacksRef = useRef({
    onSelectEvent,
    onEventReschedule,
    onRangeUpdate,
    onClickDateTime,
  });
  callbacksRef.current = {
    onSelectEvent,
    onEventReschedule,
    onRangeUpdate,
    onClickDateTime,
  };

  const calendarColors = React.useMemo(() => {
    const map: Record<
      string,
      {
        colorName: string;
        lightColors: { main: string; container: string; onContainer: string };
        darkColors: { main: string; container: string; onContainer: string };
      }
    > = {
      daily: {
        colorName: "daily",
        lightColors: { main: "#7c3aed", container: "#7c3aed22", onContainer: "#1e1e1e" },
        darkColors: { main: "#8b5cf6", container: "#8b5cf633", onContainer: "#f4f4f5" },
      },
      primary: {
        colorName: "primary",
        lightColors: { main: "#7c3aed", container: "#7c3aed22", onContainer: "#1e1e1e" },
        darkColors: { main: "#8b5cf6", container: "#8b5cf633", onContainer: "#f4f4f5" },
      },
      vault_reminders: {
        colorName: "vault_reminders",
        lightColors: { main: "#d97706", container: "#d9770622", onContainer: "#1e1e1e" },
        darkColors: { main: "#f59e0b", container: "#f59e0b33", onContainer: "#f4f4f5" },
      },
    };

    for (const cal of calendars) {
      const safeName = cal.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const hex = cal.backgroundColor || "#7c3aed";
      map[cal.id] = {
        colorName: safeName,
        lightColors: {
          main: hex,
          container: `${hex}22`,
          onContainer: "#1e1e1e",
        },
        darkColors: {
          main: hex,
          container: `${hex}33`,
          onContainer: "#f0f0f0",
        },
      };
    }
    return map;
  }, [calendars]);

  const effectiveDate = selectedDate || new Date().toISOString().slice(0, 10);

  const calendar = useCalendarApp({
    views: [
      createViewMonthGrid(),
      createViewWeek(),
      createViewDay(),
      createViewMonthAgenda(),
    ],
    defaultView: view,
    selectedDate: effectiveDate,
    isDark: true,
    calendars: calendarColors,
    events: toScheduleXEvents(events),
    plugins: [eventsService, dragPlugin],
    callbacks: {
      beforeRender($app) {
        appRef.current = $app;
      },
      onEventClick(calendarEvent) {
        const found = eventsRef.current.find(
          (e) => e.id === String(calendarEvent.id),
        );
        if (found && callbacksRef.current.onSelectEvent) {
          callbacksRef.current.onSelectEvent(found);
        }
      },
      onEventUpdate(updatedEvent) {
        const found = eventsRef.current.find(
          (e) => e.id === String(updatedEvent.id),
        );
        if (found && callbacksRef.current.onEventReschedule) {
          callbacksRef.current.onEventReschedule(
            found,
            updatedEvent.start,
            updatedEvent.end,
          );
        }
      },
      onRangeUpdate(range) {
        if (callbacksRef.current.onRangeUpdate) {
          callbacksRef.current.onRangeUpdate(range);
        }
      },
      onClickDateTime(dateTime) {
        if (callbacksRef.current.onClickDateTime) {
          callbacksRef.current.onClickDateTime(dateTime);
        }
      },
      onClickDate(date) {
        if (callbacksRef.current.onClickDateTime) {
          callbacksRef.current.onClickDateTime(date);
        }
      },
    },
  });

  useEffect(() => {
    const mapped = toScheduleXEvents(events);
    try {
      eventsService.set(mapped);
    } catch {
      // Calendar may not have finished mounting yet
    }
    if (appRef.current?.calendarEvents?.list) {
      appRef.current.calendarEvents.list.value = mapped;
    }
  }, [events, eventsService]);

  useEffect(() => {
    const $app = appRef.current;
    if ($app && view) {
      try {
        $app.calendarState.setView(view, effectiveDate);
      } catch {
        // Ignore if view transition fails before mount
      }
    }
  }, [view, effectiveDate]);

  useEffect(() => {
    const $app = appRef.current;
    if ($app && effectiveDate) {
      try {
        $app.datePickerState.selectedDate.value = effectiveDate;
        $app.calendarState.setRange(effectiveDate);
      } catch {
        // Ignore if not yet mounted
      }
    }
  }, [effectiveDate]);

  return (
    <div
      className={styles["schedule-x-wrapper"]}
      data-testid="schedule-x-calendar"
    >
      <SXCalendar calendarApp={calendar} />
    </div>
  );
}
export { ScheduleXCalendar as ScheduleXCalendarView };
