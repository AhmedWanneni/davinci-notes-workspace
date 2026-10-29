import React, { useState, useEffect } from "react";
import { Button, Typography } from "@app/design-system";
import { Trash, VideoCamera, NotePencil, X } from "@phosphor-icons/react";
import type {
  CalendarListItem,
  CreateCalendarEventInput,
  NormalizedCalendarEvent,
} from "@app/google-calendar-api";
import { adjustGoogleAllDayEnd, toGoogleAllDayEnd } from "../../calendar/scheduleXAdapter";
import { findDailyCalendar } from "../../calendar/ensureDailyCalendar";
import styles from "./EventModal.module.scss";

export interface EventModalProps {
  isOpen: boolean;
  event?: NormalizedCalendarEvent | null;
  initialDate?: string;
  calendars?: CalendarListItem[];
  onClose: () => void;
  onSave: (calendarId: string, data: CreateCalendarEventInput) => void;
  onDelete?: (event: NormalizedCalendarEvent) => void;
  onJoinMeet?: (url: string) => void;
  onCreateNote?: (event: NormalizedCalendarEvent) => void;
}

const EMPTY_CALENDARS: CalendarListItem[] = [];
const pad = (n: number): string => String(n).padStart(2, "0");

function parseIsoToLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: iso.slice(0, 10), time: "09:00" };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function EventModal({
  isOpen,
  event,
  initialDate,
  calendars = EMPTY_CALENDARS,
  onClose,
  onSave,
  onDelete,
  onJoinMeet,
  onCreateNote,
}: EventModalProps) {
  const todayStr = initialDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [calendarId, setCalendarId] = useState("daily");

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title === "(No title)" ? "" : event.title);
      setIsAllDay(event.isAllDay);
      setLocation(event.location ?? "");
      setDescription(event.description ?? "");
      setCalendarId(event.calendarId);
      if (event.isAllDay) {
        const sDate = event.startIso.slice(0, 10);
        setStartDate(sDate);
        setEndDate(adjustGoogleAllDayEnd(sDate, event.endIso.slice(0, 10)));
      } else {
        const s = parseIsoToLocalParts(event.startIso);
        const e = parseIsoToLocalParts(event.endIso);
        setStartDate(s.date);
        setStartTime(s.time);
        setEndDate(e.date);
        setEndTime(e.time);
      }
    } else {
      const dStr = initialDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      setTitle("");
      setIsAllDay(false);
      setStartDate(dStr);
      setStartTime("09:00");
      setEndDate(dStr);
      setEndTime("10:00");
      setLocation("");
      setDescription("");
      const dailyCal = findDailyCalendar(calendars);
      setCalendarId(dailyCal?.id || "daily");
    }
  }, [isOpen, event, initialDate, calendars]);

  if (!isOpen) return null;

  const isRecurring = Boolean(event?.recurringEventId || event?.recurrenceRule);
  const isReadOnlyReminder = Boolean(event?.id.startsWith("reminder_"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const rawTitle = title.replace(/^🔔\s*/, "").trim();
    const summary = rawTitle || "(No title)";
    const loc = location.trim() || undefined;
    const desc = description.trim() || undefined;
    const dailyCal = findDailyCalendar(calendars);
    const targetCalId = isReadOnlyReminder ? (dailyCal?.id || "daily") : calendarId;
    const reminders = isReadOnlyReminder
      ? { useDefault: false, overrides: [{ method: "popup" as const, minutes: 0 }, { method: "popup" as const, minutes: 10 }] }
      : undefined;

    if (isAllDay) {
      const effectiveEnd = endDate < startDate ? startDate : endDate;
      onSave(targetCalId, { summary, location: loc, description: desc, start: { date: startDate }, end: { date: toGoogleAllDayEnd(effectiveEnd) }, reminders });
    } else {
      const startDt = new Date(`${startDate}T${startTime}:00`);
      const endDt = new Date(`${endDate}T${endTime}:00`);
      const validEnd = endDt <= startDt ? new Date(startDt.getTime() + 3600_000) : endDt;
      onSave(targetCalId, { summary, location: loc, description: desc, start: { dateTime: startDt.toISOString(), timeZone: tz }, end: { dateTime: validEnd.toISOString(), timeZone: tz }, reminders });
    }
  };

  return (
    <div className={styles["event-modal-backdrop"]} data-testid="event-modal-backdrop">
      <form className={styles["event-modal"]} onSubmit={handleSubmit} data-testid="event-modal">
        <div className={styles["event-modal__header"]}>
          <Typography variant="h2" size="sm" weight="semibold" className={styles["event-modal__title"]}>
            {isReadOnlyReminder ? "Vault Reminder" : event ? "Edit Event" : "New Event"}
          </Typography>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} aria-label="Close modal">
            <X size={15} weight="bold" />
          </Button>
        </div>

        <div className={styles["event-modal__body"]}>
          {isRecurring && (
            <div className={styles["event-modal__recurrence-notice"]} data-testid="event-recurrence-notice">
              Recurring event — changes apply to this series.
            </div>
          )}

          <div className={styles["event-modal__field"]}>
            <label className={styles["event-modal__label"]} htmlFor="evt-title">Title</label>
            <input id="evt-title" className={styles["event-modal__input"]} type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="event-title-input" disabled={isReadOnlyReminder} autoFocus />
          </div>

          <label className={styles["event-modal__checkbox-row"]}>
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} data-testid="event-all-day-checkbox" disabled={isReadOnlyReminder} />
            <span>All-day event</span>
          </label>

          <div className={styles["event-modal__row"]}>
            <div className={styles["event-modal__field"]}>
              <label className={styles["event-modal__label"]} htmlFor="evt-start-date">Start Date</label>
              <input id="evt-start-date" className={styles["event-modal__input"]} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="event-start-date" disabled={isReadOnlyReminder} />
            </div>
            {!isAllDay && (
              <div className={styles["event-modal__field"]}>
                <label className={styles["event-modal__label"]} htmlFor="evt-start-time">Start Time</label>
                <input id="evt-start-time" className={styles["event-modal__input"]} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} data-testid="event-start-time" disabled={isReadOnlyReminder} />
              </div>
            )}
          </div>

          <div className={styles["event-modal__row"]}>
            <div className={styles["event-modal__field"]}>
              <label className={styles["event-modal__label"]} htmlFor="evt-end-date">End Date</label>
              <input id="evt-end-date" className={styles["event-modal__input"]} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="event-end-date" disabled={isReadOnlyReminder} />
            </div>
            {!isAllDay && (
              <div className={styles["event-modal__field"]}>
                <label className={styles["event-modal__label"]} htmlFor="evt-end-time">End Time</label>
                <input id="evt-end-time" className={styles["event-modal__input"]} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} data-testid="event-end-time" disabled={isReadOnlyReminder} />
              </div>
            )}
          </div>

          {!event && calendars.length > 1 && (
            <div className={styles["event-modal__field"]}>
              <label className={styles["event-modal__label"]} htmlFor="evt-cal">Calendar</label>
              <select id="evt-cal" className={styles["event-modal__select"]} value={calendarId} onChange={(e) => setCalendarId(e.target.value)} data-testid="event-calendar-select">
                {calendars.map((c) => <option key={c.id} value={c.id}>{c.summary}</option>)}
              </select>
            </div>
          )}

          <div className={styles["event-modal__field"]}>
            <label className={styles["event-modal__label"]} htmlFor="evt-loc">Location</label>
            <input id="evt-loc" className={styles["event-modal__input"]} type="text" placeholder="Location or link" value={location} onChange={(e) => setLocation(e.target.value)} data-testid="event-location-input" disabled={isReadOnlyReminder} />
          </div>

          <div className={styles["event-modal__field"]}>
            <label className={styles["event-modal__label"]} htmlFor="evt-desc">Description</label>
            <textarea id="evt-desc" className={styles["event-modal__textarea"]} placeholder="Notes or agenda..." value={description} onChange={(e) => setDescription(e.target.value)} data-testid="event-description-input" disabled={isReadOnlyReminder} />
          </div>

          {event && (event.meetUrl || onCreateNote) && (
            <div className={styles["event-modal__quick-actions"]}>
              {event.meetUrl && onJoinMeet && (
                <Button variant="secondary" size="sm" type="button" onClick={() => onJoinMeet(event.meetUrl!)}>
                  <VideoCamera size={14} weight="fill" />
                  <span>Join Google Meet</span>
                </Button>
              )}
              {onCreateNote && (
                <Button variant="secondary" size="sm" type="button" onClick={() => onCreateNote(event)}>
                  <NotePencil size={14} weight="regular" />
                  <span>Meeting Note</span>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className={styles["event-modal__footer"]}>
          {event && !isReadOnlyReminder && onDelete && (
            <Button variant="ghost" size="sm" type="button" onClick={() => onDelete(event)} data-testid="event-delete-btn">
              <Trash size={14} weight="regular" />
              <span>Delete</span>
            </Button>
          )}
          <div className={styles["event-modal__footer-right"]}>
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              {isReadOnlyReminder ? "Close" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              data-testid={isReadOnlyReminder ? "event-promote-reminder-btn" : "event-save-btn"}
            >
              {isReadOnlyReminder ? "Add as Calendar Event" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
