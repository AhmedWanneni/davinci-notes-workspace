import type { CalendarListItem, GoogleCalendarClient } from "@app/google-calendar-api";
import {
  getCalendarsFromDb,
  saveCalendarsToDb,
  updateCalendarSelectedInDb,
} from "./sqliteCalendarStore";

export const DAILY_CALENDAR_SUMMARY = "Daily";

export function findDailyCalendar(
  calendars: CalendarListItem[]
): CalendarListItem | undefined {
  return calendars.find(
    (c) => c.summary.trim().toLowerCase() === DAILY_CALENDAR_SUMMARY.toLowerCase()
  );
}

export async function resolveLocalDailyCalendarId(): Promise<string> {
  try {
    const dbCals = await getCalendarsFromDb();
    const daily = findDailyCalendar(dbCals);
    if (daily) return daily.id;
  } catch {
    // ignore
  }
  return "daily";
}

export async function ensureDailyCalendar(
  client: GoogleCalendarClient,
  accessToken: string
): Promise<CalendarListItem> {
  const localCals = await getCalendarsFromDb().catch(() => []);
  const localDaily = findDailyCalendar(localCals);
  if (localDaily && localDaily.id !== "daily") {
    if (!localDaily.selected) {
      await updateCalendarSelectedInDb(localDaily.id, true);
    }
    return { ...localDaily, selected: true };
  }

  const remoteCals = await client.listCalendars(accessToken);
  const remoteDaily = findDailyCalendar(remoteCals);
  if (remoteDaily) {
    const withSelected = remoteCals.map((c) =>
      c.id === remoteDaily.id ? { ...c, selected: true } : c
    );
    await saveCalendarsToDb(withSelected);
    return { ...remoteDaily, selected: true };
  }

  await saveCalendarsToDb(remoteCals);

  try {
    const created = await client.createCalendar(accessToken, DAILY_CALENDAR_SUMMARY);
    await saveCalendarsToDb([{ ...created, selected: true }]);
    return { ...created, selected: true };
  } catch {
    const primary = remoteCals.find((c) => c.primary) ?? remoteCals[0];
    return primary ?? { id: "primary", summary: DAILY_CALENDAR_SUMMARY, selected: true };
  }
}
