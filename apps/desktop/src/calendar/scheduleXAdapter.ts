import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

export interface ScheduleXEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  calendarId?: string;
  _rawEvent?: NormalizedCalendarEvent;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatLocalScheduleXDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return isoString.slice(0, 16).replace("T", " ");
  }
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function adjustGoogleAllDayEnd(startDate: string, endDate: string): string {
  if (!endDate || endDate <= startDate) {
    return startDate;
  }
  const [y, m, d] = endDate.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  end.setDate(end.getDate() - 1);
  const adjusted = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  return adjusted < startDate ? startDate : adjusted;
}

export function toGoogleAllDayEnd(inclusiveEndDate: string): string {
  const [y, m, d] = inclusiveEndDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toScheduleXEvent(evt: NormalizedCalendarEvent): ScheduleXEvent {
  let start: string;
  let end: string;

  if (evt.isAllDay) {
    start = evt.startIso.slice(0, 10);
    const rawEnd = evt.endIso.slice(0, 10);
    end = adjustGoogleAllDayEnd(start, rawEnd);
  } else {
    start = formatLocalScheduleXDateTime(evt.startIso);
    end = formatLocalScheduleXDateTime(evt.endIso);
  }

  return {
    id: evt.id,
    title: evt.title || "(No title)",
    start,
    end,
    description: evt.description,
    location: evt.location,
    calendarId: evt.calendarId,
    _rawEvent: evt,
  };
}

export function toScheduleXEvents(events: NormalizedCalendarEvent[]): ScheduleXEvent[] {
  return events.map(toScheduleXEvent);
}
