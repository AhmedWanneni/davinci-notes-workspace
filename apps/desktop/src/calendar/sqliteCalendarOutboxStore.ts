import type {
  CalendarEventSyncStatus,
  CalendarMutationAction,
  CalendarOutboxItem,
} from "@app/google-calendar-api";
import { getVaultIndexDb, withDbLock } from "../vault/sqliteIndex";

interface OutboxDbRow {
  id: string;
  client_mutation_id: string;
  calendar_id: string;
  event_id: string;
  action: string;
  payload_json: string;
  etag: string | null;
  attempts: number;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export type EnqueueOutboxInput = Omit<
  CalendarOutboxItem,
  "id" | "attempts" | "createdAt" | "updatedAt"
>;

export async function enqueueOutboxMutation(
  input: EnqueueOutboxInput,
): Promise<CalendarOutboxItem> {
  const db = await getVaultIndexDb();
  const id = `outbox_${crypto.randomUUID()}`;
  const now = Date.now();

  const item: CalendarOutboxItem = {
    ...input,
    id,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  await withDbLock(() =>
    db.execute(
      `INSERT INTO google_calendar_outbox (
         id, client_mutation_id, calendar_id, event_id, action,
         payload_json, etag, attempts, last_error, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT(client_mutation_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         etag = excluded.etag,
         updated_at = excluded.updated_at;`,
      [
        item.id,
        item.clientMutationId,
        item.calendarId,
        item.eventId,
        item.action,
        item.payloadJson,
        item.etag ?? null,
        item.attempts,
        item.lastError ?? null,
        item.createdAt,
        item.updatedAt,
      ],
    ),
  );

  return item;
}

export async function getPendingOutboxItems(limit = 50): Promise<CalendarOutboxItem[]> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    const rows = await db.select<OutboxDbRow[]>(
      `SELECT * FROM google_calendar_outbox
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );

    return rows.map((r) => ({
      id: r.id,
      clientMutationId: r.client_mutation_id,
      calendarId: r.calendar_id,
      eventId: r.event_id,
      action: r.action as CalendarMutationAction,
      payloadJson: r.payload_json,
      etag: r.etag ?? undefined,
      attempts: r.attempts,
      lastError: r.last_error ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  });
}

export async function updateOutboxItemError(id: string, errorMessage: string): Promise<void> {
  const db = await getVaultIndexDb();
  const now = Date.now();
  await withDbLock(() =>
    db.execute(
      `UPDATE google_calendar_outbox
       SET attempts = attempts + 1, last_error = $1, updated_at = $2
       WHERE id = $3`,
      [errorMessage, now, id],
    ),
  );
}

export async function removeOutboxItem(id: string): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    db.execute("DELETE FROM google_calendar_outbox WHERE id = $1", [id]),
  );
}

export async function markEventSyncStatus(
  eventId: string,
  status: CalendarEventSyncStatus,
  etag?: string,
): Promise<void> {
  const db = await getVaultIndexDb();
  const now = Date.now();
  await withDbLock(() =>
    db.execute(
      `UPDATE google_calendar_events
       SET sync_status = $1,
           etag = COALESCE($2, etag),
           updated_at = $3
       WHERE id = $4`,
      [status, etag ?? null, now, eventId],
    ),
  );
}

export async function getOutboxCount(): Promise<number> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    const rows = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM google_calendar_outbox",
    );
    return rows[0]?.count ?? 0;
  });
}
