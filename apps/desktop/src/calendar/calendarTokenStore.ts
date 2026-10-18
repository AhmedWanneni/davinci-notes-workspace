import { invoke } from "@tauri-apps/api/core";

export interface CalendarOAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
}

export interface CalendarTokenStore {
  load(): Promise<CalendarOAuthToken | null>;
  save(token: CalendarOAuthToken): Promise<void>;
  clear(): Promise<void>;
}

export function createCalendarTokenStore(): CalendarTokenStore {
  return {
    load: async () => {
      const raw = await invoke<string | null>("load_calendar_token");
      if (!raw) return null;
      try {
        return JSON.parse(raw) as CalendarOAuthToken;
      } catch {
        return null;
      }
    },
    save: async (token: CalendarOAuthToken) => {
      await invoke("save_calendar_token", { token: JSON.stringify(token) });
    },
    clear: async () => {
      await invoke("clear_calendar_token");
    },
  };
}
