import type {
  CalendarListItem,
  CreateCalendarEventInput,
  GoogleCalendarApiEvent,
  ListEventsOptions,
  ListEventsResult,
  NormalizedCalendarEvent,
  UpdateCalendarEventInput,
} from "./calendarTypes";
import { parseMeetLink } from "./parseMeetLink";

const BASE_URL = "https://www.googleapis.com/calendar/v3";

export class GoogleAuthExpiredError extends Error {
  constructor(message = "Google authorization expired or invalid") {
    super(message);
    this.name = "GoogleAuthExpiredError";
  }
}

export class GoogleSyncTokenExpiredError extends Error {
  constructor(message = "Sync token expired or invalid; full sync required") {
    super(message);
    this.name = "GoogleSyncTokenExpiredError";
  }
}

export class GoogleCalendarApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleCalendarApiError";
  }
}

export interface GoogleCalendarClientOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

function normalizeEvent(
  calendarId: string,
  raw: GoogleCalendarApiEvent,
): NormalizedCalendarEvent {
  const isAllDay = Boolean(raw.start?.date && !raw.start?.dateTime);
  const startIso = raw.start?.dateTime || raw.start?.date || new Date().toISOString();
  const endIso = raw.end?.dateTime || raw.end?.date || startIso;
  const status: "confirmed" | "tentative" | "cancelled" =
    raw.status === "cancelled" || raw.status === "tentative" ? raw.status : "confirmed";

  return {
    id: raw.id,
    calendarId,
    title: raw.summary?.trim() || "(No title)",
    startIso,
    endIso,
    isAllDay,
    meetUrl: parseMeetLink(raw),
    location: raw.location?.trim() || undefined,
    description: raw.description?.trim() || undefined,
    status,
    attendees: Array.isArray(raw.attendees) ? raw.attendees : [],
    updatedAt: raw.updated ? new Date(raw.updated).getTime() : Date.now(),
  };
}

export class GoogleCalendarClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: GoogleCalendarClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.baseUrl = options.baseUrl ?? BASE_URL;
  }

  async listCalendars(accessToken: string): Promise<CalendarListItem[]> {
    const url = `${this.baseUrl}/users/me/calendarList`;
    const response = await this.fetchFn(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to list calendars: ${text}`);
    }

    const data = (await response.json()) as { items?: CalendarListItem[] };
    return (data.items || []).map((item) => ({
      id: item.id,
      summary: item.summary || item.id,
      primary: Boolean(item.primary),
      description: item.description,
      backgroundColor: item.backgroundColor,
      foregroundColor: item.foregroundColor,
      selected: item.selected !== false,
    }));
  }

  async listEvents(
    accessToken: string,
    calendarId = "primary",
    options: ListEventsOptions = {},
  ): Promise<ListEventsResult> {
    const url = new URL(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`);

    if (options.syncToken) {
      url.searchParams.set("syncToken", options.syncToken);
    } else {
      if (options.timeMin) url.searchParams.set("timeMin", options.timeMin);
      if (options.timeMax) url.searchParams.set("timeMax", options.timeMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", options.orderBy ?? "startTime");
    }

    if (options.pageToken) url.searchParams.set("pageToken", options.pageToken);
    if (options.maxResults) url.searchParams.set("maxResults", String(options.maxResults));

    const response = await this.fetchFn(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (response.status === 410) throw new GoogleSyncTokenExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to list events: ${text}`);
    }

    const data = (await response.json()) as {
      items?: GoogleCalendarApiEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };

    const events = (data.items || []).map((raw) => normalizeEvent(calendarId, raw));

    return {
      events,
      nextPageToken: data.nextPageToken,
      nextSyncToken: data.nextSyncToken,
    };
  }

  async createEvent(
    accessToken: string,
    calendarId = "primary",
    event: CreateCalendarEventInput,
  ): Promise<NormalizedCalendarEvent> {
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`;
    const response = await this.fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(event),
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to create event: ${text}`);
    }

    const data = (await response.json()) as GoogleCalendarApiEvent;
    return normalizeEvent(calendarId, data);
  }

  async updateEvent(
    accessToken: string,
    calendarId = "primary",
    eventId: string,
    patch: UpdateCalendarEventInput,
  ): Promise<NormalizedCalendarEvent> {
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const response = await this.fetchFn(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(patch),
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to update event: ${text}`);
    }

    const data = (await response.json()) as GoogleCalendarApiEvent;
    return normalizeEvent(calendarId, data);
  }
}
