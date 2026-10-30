import { GoogleCalendarClient } from "@app/google-calendar-api";
import {
  getCalendarAccessToken,
  loadCalendarToken,
  signInToCalendar,
} from "./desktopCalendarAuth";
import { getCalendarClientId, setDynamicCalendarClientId } from "./calendarAuthConfig";
import { ensureDailyCalendar } from "./ensureDailyCalendar";
import { CalendarOutboxWorker } from "./calendarOutboxWorker";
import { CalendarSyncEngine } from "./calendarSyncEngine";
import { getVaultIndexDb } from "../vault/sqliteIndex";
import { getSetting } from "../vault/settingsCommands";

export async function checkCalendarConnected(): Promise<boolean> {
  try {
    const token = await loadCalendarToken();
    return Boolean(token?.accessToken);
  } catch {
    return false;
  }
}

export async function flushAndSyncCalendar(
  onConflict?: (msg: string) => void
): Promise<void> {
  const isConnected = await checkCalendarConnected();
  if (!isConnected) return;

  const client = new GoogleCalendarClient();
  const accessToken = await getCalendarAccessToken();
  await ensureDailyCalendar(client, accessToken).catch(() => null);

  const outboxWorker = new CalendarOutboxWorker({
    client,
    getAccessToken: () => getCalendarAccessToken(),
    onConflictResolved: (_evt, msg) => onConflict?.(msg),
  });
  await outboxWorker.flushOutbox();

  const syncEngine = new CalendarSyncEngine({
    client,
    getAccessToken: () => getCalendarAccessToken(),
  });
  await syncEngine.syncNow();
}

export async function connectGoogleCalendarInteractive(
  onOpenSettings?: () => void
): Promise<boolean> {
  let clientId = getCalendarClientId();
  if (!clientId) {
    try {
      const db = await getVaultIndexDb();
      const saved = await getSetting(db, "calendar.clientId");
      if (saved) {
        clientId = saved;
        setDynamicCalendarClientId(saved);
      }
    } catch {
      // ignore
    }
  }

  if (!clientId) {
    onOpenSettings?.();
    return false;
  }

  const token = await signInToCalendar(undefined, undefined, clientId);
  const client = new GoogleCalendarClient();
  await ensureDailyCalendar(client, token.accessToken);
  await flushAndSyncCalendar();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("davinci:calendar-updated"));
  }
  return true;
}
