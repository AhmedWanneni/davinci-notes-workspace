export interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

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

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarApiEvent {
  id: string;
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
}

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
