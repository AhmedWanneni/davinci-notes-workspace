import type {
  CalendarListItem,
  CreateCalendarEventInput,
  GoogleCalendarApiEvent,
  ListEventsOptions,
  ListEventsResult,
  NormalizedCalendarEvent,
  UpdateCalendarEventInput,
} from "./calendarTypes";
import {
  GoogleAuthExpiredError,
  GoogleCalendarApiError,
  GooglePreconditionFailedError,
  GoogleSyncTokenExpiredError,
} from "./calendarErrors";
import { normalizeCalendarEvent } from "./normalizeCalendarEvent";

export {
  GoogleAuthExpiredError,
  GoogleCalendarApiError,
  GooglePreconditionFailedError,
  GoogleSyncTokenExpiredError,
};

const BASE_URL = "https://www.googleapis.com/calendar/v3";

export interface GoogleCalendarClientOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

export class GoogleCalendarClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: GoogleCalendarClientOptions = {}) {
    this.fetchFn =
      options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
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

  async createCalendar(
    accessToken: string,
    summary = "Daily",
    description = "DaVinci Notes Daily Calendar",
  ): Promise<CalendarListItem> {
    const url = `${this.baseUrl}/calendars`;
    const response = await this.fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ summary, description }),
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to create calendar: ${text}`);
    }

    const item = (await response.json()) as CalendarListItem;
    return {
      id: item.id,
      summary: item.summary || summary,
      primary: false,
      description: item.description,
      backgroundColor: item.backgroundColor,
      foregroundColor: item.foregroundColor,
      selected: true,
    };
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

    return {
      events: (data.items || []).map((raw) => normalizeCalendarEvent(calendarId, raw)),
      nextPageToken: data.nextPageToken,
      nextSyncToken: data.nextSyncToken,
    };
  }

  async getEvent(
    accessToken: string,
    calendarId = "primary",
    eventId: string,
  ): Promise<NormalizedCalendarEvent> {
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const response = await this.fetchFn(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to get event: ${text}`);
    }

    const data = (await response.json()) as GoogleCalendarApiEvent;
    return normalizeCalendarEvent(calendarId, data);
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
    return normalizeCalendarEvent(calendarId, data);
  }

  async updateEvent(
    accessToken: string,
    calendarId = "primary",
    eventId: string,
    patch: UpdateCalendarEventInput,
    etag?: string,
  ): Promise<NormalizedCalendarEvent> {
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (etag) headers["If-Match"] = etag;

    const response = await this.fetchFn(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (response.status === 412) throw new GooglePreconditionFailedError();
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to update event: ${text}`);
    }

    const data = (await response.json()) as GoogleCalendarApiEvent;
    return normalizeCalendarEvent(calendarId, data);
  }

  async deleteEvent(
    accessToken: string,
    calendarId = "primary",
    eventId: string,
    etag?: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
    if (etag) headers["If-Match"] = etag;

    const response = await this.fetchFn(url, { method: "DELETE", headers });

    if (response.status === 401) throw new GoogleAuthExpiredError();
    if (response.status === 412) throw new GooglePreconditionFailedError();
    if (response.status === 404 || response.status === 410) return;
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GoogleCalendarApiError(response.status, `Failed to delete event: ${text}`);
    }
  }
}
