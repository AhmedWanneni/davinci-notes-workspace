import {
  GoogleAuthExpiredError,
  GoogleCalendarClient,
  GoogleSyncTokenExpiredError,
} from "@app/google-calendar-api";
import {
  getCalendarSyncToken,
  getCalendarsFromDb,
  saveCalendarSyncToken,
  saveCalendarsToDb,
  saveEventsToDb,
} from "./sqliteCalendarStore";

export interface CalendarSyncEngineOptions {
  client?: GoogleCalendarClient;
  getAccessToken: () => Promise<string>;
  onSyncComplete?: (count: number) => void;
  onError?: (err: Error) => void;
  daysAhead?: number;
}

export class CalendarSyncEngine {
  private readonly client: GoogleCalendarClient;
  private readonly getAccessToken: () => Promise<string>;
  private readonly onSyncComplete?: (count: number) => void;
  private readonly onError?: (err: Error) => void;
  private readonly daysAhead: number;

  private isSyncing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: CalendarSyncEngineOptions) {
    this.client = options.client ?? new GoogleCalendarClient();
    this.getAccessToken = options.getAccessToken;
    this.onSyncComplete = options.onSyncComplete;
    this.onError = options.onError;
    this.daysAhead = options.daysAhead ?? 35;
  }

  async syncDateRange(
    timeMin: string,
    timeMax: string,
  ): Promise<{ success: boolean; eventCount: number; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const allCalendars = await getCalendarsFromDb();
      const selectedCalendars = allCalendars.filter((c) => c.selected);

      let totalEvents = 0;
      for (const cal of selectedCalendars) {
        const result = await this.client.listEvents(accessToken, cal.id, {
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
        });

        if (result.events.length > 0) {
          await saveEventsToDb(result.events);
          totalEvents += result.events.length;
        }
      }

      this.onSyncComplete?.(totalEvents);
      return { success: true, eventCount: totalEvents };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
      return {
        success: false,
        eventCount: 0,
        error: error instanceof GoogleAuthExpiredError ? "auth-expired" : error.message,
      };
    }
  }

  async syncNow(): Promise<{ success: boolean; eventCount: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, eventCount: 0, error: "Sync already in progress" };
    }
    this.isSyncing = true;

    try {
      const accessToken = await this.getAccessToken();
      const remoteCalendars = await this.client.listCalendars(accessToken);
      await saveCalendarsToDb(remoteCalendars);

      const allCalendars = await getCalendarsFromDb();
      const selectedCalendars = allCalendars.filter((c) => c.selected);

      let totalEvents = 0;
      const now = new Date();
      const timeMin = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + this.daysAhead * 24 * 60 * 60 * 1000).toISOString();

      for (const cal of selectedCalendars) {
        let syncToken = await getCalendarSyncToken(cal.id);
        let result;

        try {
          result = await this.client.listEvents(accessToken, cal.id, {
            syncToken: syncToken ?? undefined,
            timeMin: syncToken ? undefined : timeMin,
            timeMax: syncToken ? undefined : timeMax,
          });
        } catch (err) {
          if (err instanceof GoogleSyncTokenExpiredError) {
            syncToken = null;
            result = await this.client.listEvents(accessToken, cal.id, {
              timeMin,
              timeMax,
            });
          } else {
            throw err;
          }
        }

        if (result.events.length > 0) {
          await saveEventsToDb(result.events);
          totalEvents += result.events.length;
        }

        if (result.nextSyncToken) {
          await saveCalendarSyncToken(cal.id, result.nextSyncToken);
        }
      }

      this.onSyncComplete?.(totalEvents);
      return { success: true, eventCount: totalEvents };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
      return {
        success: false,
        eventCount: 0,
        error: error instanceof GoogleAuthExpiredError ? "auth-expired" : error.message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  startPolling(intervalMs = 15 * 60 * 1000): void {
    this.stopPolling();
    this.timer = setInterval(() => {
      void this.syncNow();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
