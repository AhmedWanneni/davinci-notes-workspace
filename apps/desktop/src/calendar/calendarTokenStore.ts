import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import { invoke } from "@tauri-apps/api/core";

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

const CALENDAR_TOKEN_FALLBACK_KEY = "davinci_calendar_token_fallback";

function notifyCalendarAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("davinci:calendar-auth-changed"));
  }
}

export function createCalendarTokenStore(): CalendarTokenStore {
  return {
    load: async () => {
      try {
        const raw = hasPlatformAdapters()
          ? await getPlatformAdapters().secrets.getSecret("google_calendar")
          : await invoke<string | null>("load_calendar_token");
        if (raw) {
          return JSON.parse(raw) as CalendarOAuthToken;
        }
      } catch {
        // Keyring unavailable or failed; fall back to localStorage
      }
      try {
        if (typeof localStorage !== "undefined") {
          const fallback = localStorage.getItem(CALENDAR_TOKEN_FALLBACK_KEY);
          if (fallback) return JSON.parse(fallback) as CalendarOAuthToken;
        }
      } catch {
        // Ignore storage read errors
      }
      return null;
    },
    save: async (token: CalendarOAuthToken) => {
      const serialized = JSON.stringify(token);
      try {
        if (hasPlatformAdapters()) {
          await getPlatformAdapters().secrets.setSecret("google_calendar", serialized);
        } else {
          await invoke("save_calendar_token", { token: serialized });
        }
      } catch {
        // Keyring save failed; fallback below will still persist
      }
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(CALENDAR_TOKEN_FALLBACK_KEY, serialized);
        }
      } catch {
        // Ignore storage write errors
      }
      notifyCalendarAuthChanged();
    },
    clear: async () => {
      try {
        if (hasPlatformAdapters()) {
          await getPlatformAdapters().secrets.clearSecret("google_calendar");
        } else {
          await invoke("clear_calendar_token");
        }
      } catch {
        // Ignore keyring clear errors
      }
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(CALENDAR_TOKEN_FALLBACK_KEY);
        }
      } catch {
        // Ignore storage clear errors
      }
      notifyCalendarAuthChanged();
    },
  };
}
