import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

export interface CalendarOAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
  clientId?: string;
}

export interface CalendarTokenStore {
  load(): Promise<CalendarOAuthToken | null>;
  save(token: CalendarOAuthToken): Promise<void>;
  clear(): Promise<void>;
}

export function createCalendarTokenStore(): CalendarTokenStore {
  return {
    load: async () => {
      if (!hasPlatformAdapters()) return null;
      const raw =
        await getPlatformAdapters().secrets.getSecret("google_calendar");
      if (!raw) return null;
      try {
        return JSON.parse(raw) as CalendarOAuthToken;
      } catch {
        return null;
      }
    },
    save: async (token: CalendarOAuthToken) => {
      if (!hasPlatformAdapters()) return;
      await getPlatformAdapters().secrets.setSecret(
        "google_calendar",
        JSON.stringify(token),
      );
    },
    clear: async () => {
      if (!hasPlatformAdapters()) return;
      await getPlatformAdapters().secrets.clearSecret("google_calendar");
    },
  };
}
