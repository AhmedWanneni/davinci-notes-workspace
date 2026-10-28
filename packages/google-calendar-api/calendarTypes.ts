export interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

export type CalendarListEntry = CalendarListItem;

export interface ConferenceEntryPoint {
  entryPointType: "video" | "phone" | "sip" | "more" | string;
  uri: string;
  label?: string;
  pin?: string;
}

export interface ConferenceData {
  entryPoints?: ConferenceEntryPoint[];
  conferenceSolution?: {
    name?: string;
    iconUri?: string;
  };
}

export interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted" | string;
  self?: boolean;
  organizer?: boolean;
}

export type CalendarEventAttendee = EventAttendee;

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarApiEvent {
  id: string;
  etag?: string;
  status?: "confirmed" | "tentative" | "cancelled" | string;
  summary?: string;
  description?: string;
  location?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  hangoutLink?: string;
  conferenceData?: ConferenceData;
  attendees?: EventAttendee[];
  updated?: string;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
}

export type CalendarEventSyncStatus = "synced" | "pending_create" | "pending_update" | "pending_delete";

export interface NormalizedCalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startIso: string;
  endIso: string;
  isAllDay: boolean;
  meetUrl?: string;
  location?: string;
  description?: string;
  status: "confirmed" | "tentative" | "cancelled";
  attendees: EventAttendee[];
  updatedAt: number;
  etag?: string;
  recurrenceRule?: string;
  recurringEventId?: string;
  originalStartIso?: string;
  syncStatus?: CalendarEventSyncStatus;
}

export interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated";
  syncToken?: string;
  pageToken?: string;
  maxResults?: number;
}

export interface ListEventsResult {
  events: NormalizedCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface GoogleEventReminderOverride {
  method: "popup" | "email";
  minutes: number;
}

export interface GoogleEventReminders {
  useDefault: boolean;
  overrides?: GoogleEventReminderOverride[];
}

export interface CreateCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  reminders?: GoogleEventReminders;
}

export interface UpdateCalendarEventInput {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime: string; timeZone?: string } | { date: string };
  end?: { dateTime: string; timeZone?: string } | { date: string };
  status?: "confirmed" | "tentative" | "cancelled";
  reminders?: GoogleEventReminders;
}

export type CalendarMutationAction = "create" | "update" | "delete";

export interface CalendarOutboxItem {
  id: string;
  clientMutationId: string;
  calendarId: string;
  eventId: string;
  action: CalendarMutationAction;
  payloadJson: string;
  etag?: string;
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

