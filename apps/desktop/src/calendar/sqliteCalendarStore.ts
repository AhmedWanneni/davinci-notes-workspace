import type { CalendarListItem, NormalizedCalendarEvent } from "@app/google-calendar-api";
import { getVaultIndexDb, withDbLock, withDbTransaction } from "../vault/sqliteIndex";

interface CalendarDbRow {
  id: string;
  summary: string;
  is_primary: number;
  color: string | null;
  selected: number;
}

interface EventDbRow {
  id: string;
  calendar_id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  is_all_day: number;
  meet_url: string | null;
  location: string | null;
  description: string | null;
  status: string;
  attendees_json: string;
  updated_at: number;
  etag: string | null;
  recurrence_rule: string | null;
  recurring_event_id: string | null;
  original_start_iso: string | null;
  sync_status: string | null;
}

export async function saveCalendarsToDb(calendars: CalendarListItem[]): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    withDbTransaction(db, async () => {
      for (const cal of calendars) {
        await db.execute(
          `INSERT INTO google_calendars (id, summary, is_primary, color, selected)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT(id) DO UPDATE SET
             summary = excluded.summary,
             is_primary = excluded.is_primary,
             color = excluded.color;`,
          [cal.id, cal.summary, cal.primary ? 1 : 0, cal.backgroundColor ?? null, cal.selected ? 1 : 0],
        );
      }
    }),
  );
}

export async function getCalendarsFromDb(): Promise<CalendarListItem[]> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    const rows = await db.select<CalendarDbRow[]>(
      "SELECT id, summary, is_primary, color, selected FROM google_calendars ORDER BY is_primary DESC, summary ASC",
    );
    return rows.map((r) => ({
      id: r.id,
      summary: r.summary,
      primary: Boolean(r.is_primary),
      backgroundColor: r.color ?? undefined,
      selected: Boolean(r.selected),
    }));
  });
}

export async function updateCalendarSelectedInDb(calendarId: string, selected: boolean): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    db.execute("UPDATE google_calendars SET selected = $1 WHERE id = $2", [selected ? 1 : 0, calendarId]),
  );
}

export async function saveEventsToDb(events: NormalizedCalendarEvent[]): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    withDbTransaction(db, async () => {
      for (const evt of events) {
        if (evt.status === "cancelled") {
          await db.execute("DELETE FROM google_calendar_events WHERE id = $1", [evt.id]);
          continue;
        }

        await db.execute(
          `INSERT INTO google_calendar_events (
             id, calendar_id, title, start_iso, end_iso, is_all_day,
             meet_url, location, description, status, attendees_json, updated_at,
             etag, recurrence_rule, recurring_event_id, original_start_iso, sync_status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT(id) DO UPDATE SET
             calendar_id = excluded.calendar_id, title = excluded.title,
             start_iso = excluded.start_iso, end_iso = excluded.end_iso, is_all_day = excluded.is_all_day,
             meet_url = excluded.meet_url, location = excluded.location, description = excluded.description,
             status = excluded.status, attendees_json = excluded.attendees_json, updated_at = excluded.updated_at,
             etag = excluded.etag, recurrence_rule = excluded.recurrence_rule,
             recurring_event_id = excluded.recurring_event_id, original_start_iso = excluded.original_start_iso,
             sync_status = excluded.sync_status;`,
          [
            evt.id, evt.calendarId, evt.title, evt.startIso, evt.endIso, evt.isAllDay ? 1 : 0,
            evt.meetUrl ?? null, evt.location ?? null, evt.description ?? null, evt.status,
            JSON.stringify(evt.attendees), evt.updatedAt,
            evt.etag ?? null, evt.recurrenceRule ?? null, evt.recurringEventId ?? null,
            evt.originalStartIso ?? null, evt.syncStatus ?? "synced",
          ],
        );
      }
    }),
  );
}

export async function getEventsFromDb(options: {
  timeMin?: string;
  timeMax?: string;
  includeDeclined?: boolean;
} = {}): Promise<NormalizedCalendarEvent[]> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    let sql = `
      SELECT e.* FROM google_calendar_events e
      LEFT JOIN google_calendars c ON e.calendar_id = c.id
      WHERE (c.selected = 1 OR c.id IS NULL) AND e.status != 'cancelled'
    `;
    const params: unknown[] = [];

    if (options.timeMin) {
      params.push(options.timeMin);
      sql += ` AND e.end_iso >= $${params.length}`;
    }
    if (options.timeMax) {
      params.push(options.timeMax);
      sql += ` AND e.start_iso <= $${params.length}`;
    }

    sql += " ORDER BY e.start_iso ASC";
    const rows = await db.select<EventDbRow[]>(sql, params);

    return rows
      .map((r) => {
        let attendees = [];
        try {
          attendees = JSON.parse(r.attendees_json);
        } catch {
          attendees = [];
        }
        return {
          id: r.id,
          calendarId: r.calendar_id,
          title: r.title,
          startIso: r.start_iso,
          endIso: r.end_iso,
          isAllDay: Boolean(r.is_all_day),
          meetUrl: r.meet_url ?? undefined,
          location: r.location ?? undefined,
          description: r.description ?? undefined,
          status: r.status as "confirmed" | "tentative" | "cancelled",
          attendees,
          updatedAt: r.updated_at,
          etag: r.etag ?? undefined,
          recurrenceRule: r.recurrence_rule ?? undefined,
          recurringEventId: r.recurring_event_id ?? undefined,
          originalStartIso: r.original_start_iso ?? undefined,
          syncStatus: (r.sync_status as NormalizedCalendarEvent["syncStatus"]) ?? "synced",
        };
      })
      .filter((evt) => {
        if (options.includeDeclined) return true;
        const selfAttendee = evt.attendees.find((a: { self?: boolean }) => a.self);
        return selfAttendee?.responseStatus !== "declined";
      });
  });
}

export async function getCalendarSyncToken(calendarId: string): Promise<string | null> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    const rows = await db.select<{ sync_token: string }[]>(
      "SELECT sync_token FROM google_calendar_sync_state WHERE calendar_id = $1",
      [calendarId],
    );
    return rows[0]?.sync_token ?? null;
  });
}

export async function saveCalendarSyncToken(calendarId: string, syncToken: string): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    db.execute(
      `INSERT INTO google_calendar_sync_state (calendar_id, sync_token, last_synced_at)
       VALUES ($1, $2, $3)
       ON CONFLICT(calendar_id) DO UPDATE SET
         sync_token = excluded.sync_token,
         last_synced_at = excluded.last_synced_at;`,
      [calendarId, syncToken, Date.now()],
    ),
  );
}

export async function deleteEventFromDb(eventId: string): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    db.execute("DELETE FROM google_calendar_events WHERE id = $1", [eventId]),
  );
}

export async function purgeCalendarCache(): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    withDbTransaction(db, async () => {
      await db.execute("DELETE FROM google_calendar_events;");
      await db.execute("DELETE FROM google_calendars;");
      await db.execute("DELETE FROM google_calendar_sync_state;");
      await db.execute("DELETE FROM google_calendar_outbox;");
    }),
  );
}
