import {
  GoogleCalendarClient,
  GooglePreconditionFailedError,
  type CreateCalendarEventInput,
  type NormalizedCalendarEvent,
  type UpdateCalendarEventInput,
} from "@app/google-calendar-api";
import { deleteEventFromDb, saveEventsToDb } from "./sqliteCalendarStore";
import { ensureDailyCalendar } from "./ensureDailyCalendar";
import {
  enqueueOutboxMutation,
  getPendingOutboxItems,
  markEventSyncStatus,
  removeOutboxItem,
  updateOutboxItemError,
} from "./sqliteCalendarOutboxStore";

function extractIso(dt: { dateTime: string; timeZone?: string } | { date: string }): {
  iso: string;
  isAllDay: boolean;
} {
  if ("date" in dt) {
    return { iso: dt.date, isAllDay: true };
  }
  return { iso: dt.dateTime, isAllDay: false };
}

export async function optimisticCreateEvent(
  calendarId: string,
  input: CreateCalendarEventInput,
): Promise<NormalizedCalendarEvent> {
  const tempId = `temp_${crypto.randomUUID()}`;
  const start = extractIso(input.start);
  const end = extractIso(input.end);

  const optimistic: NormalizedCalendarEvent = {
    id: tempId,
    calendarId,
    title: input.summary.trim() || "(No title)",
    startIso: start.iso,
    endIso: end.iso,
    isAllDay: start.isAllDay,
    location: input.location,
    description: input.description,
    status: "confirmed",
    attendees: [],
    updatedAt: Date.now(),
    syncStatus: "pending_create",
  };

  await saveEventsToDb([optimistic]);
  await enqueueOutboxMutation({
    clientMutationId: `create_${tempId}`,
    calendarId,
    eventId: tempId,
    action: "create",
    payloadJson: JSON.stringify(input),
  });

  return optimistic;
}

export async function optimisticUpdateEvent(
  event: NormalizedCalendarEvent,
  patch: UpdateCalendarEventInput,
): Promise<NormalizedCalendarEvent> {
  const start = patch.start ? extractIso(patch.start) : { iso: event.startIso, isAllDay: event.isAllDay };
  const end = patch.end ? extractIso(patch.end) : { iso: event.endIso, isAllDay: event.isAllDay };

  const updated: NormalizedCalendarEvent = {
    ...event,
    title: patch.summary !== undefined ? patch.summary.trim() || "(No title)" : event.title,
    description: patch.description !== undefined ? patch.description : event.description,
    location: patch.location !== undefined ? patch.location : event.location,
    startIso: start.iso,
    endIso: end.iso,
    isAllDay: start.isAllDay,
    updatedAt: Date.now(),
    syncStatus: "pending_update",
  };

  await saveEventsToDb([updated]);
  await enqueueOutboxMutation({
    clientMutationId: `update_${event.id}_${Date.now()}`,
    calendarId: event.calendarId,
    eventId: event.id,
    action: "update",
    payloadJson: JSON.stringify(patch),
    etag: event.etag,
  });

  return updated;
}

export async function optimisticDeleteEvent(
  event: NormalizedCalendarEvent,
): Promise<void> {
  await markEventSyncStatus(event.id, "pending_delete");
  await enqueueOutboxMutation({
    clientMutationId: `delete_${event.id}_${Date.now()}`,
    calendarId: event.calendarId,
    eventId: event.id,
    action: "delete",
    payloadJson: "{}",
    etag: event.etag,
  });
}

export interface CalendarOutboxWorkerOptions {
  client?: GoogleCalendarClient;
  getAccessToken: () => Promise<string>;
  onMutationSynced?: (action: string, eventId: string) => void;
  onConflictResolved?: (remoteEvent: NormalizedCalendarEvent | null, message: string) => void;
  onError?: (err: Error) => void;
}

export class CalendarOutboxWorker {
  private readonly client: GoogleCalendarClient;
  private readonly getAccessToken: () => Promise<string>;
  private readonly onMutationSynced?: (action: string, eventId: string) => void;
  private readonly onConflictResolved?: (
    remoteEvent: NormalizedCalendarEvent | null,
    message: string,
  ) => void;
  private readonly onError?: (err: Error) => void;
  private isFlushing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: CalendarOutboxWorkerOptions) {
    this.client = options.client ?? new GoogleCalendarClient();
    this.getAccessToken = options.getAccessToken;
    this.onMutationSynced = options.onMutationSynced;
    this.onConflictResolved = options.onConflictResolved;
    this.onError = options.onError;
  }

  async flushOutbox(): Promise<{ processed: number; conflicts: number; failed: number }> {
    if (this.isFlushing) {
      return { processed: 0, conflicts: 0, failed: 0 };
    }
    this.isFlushing = true;
    let processed = 0;
    let conflicts = 0;
    let failed = 0;

    try {
      const items = await getPendingOutboxItems();
      if (items.length === 0) {
        return { processed: 0, conflicts: 0, failed: 0 };
      }

      const token = await this.getAccessToken();

      for (const item of items) {
        try {
          if (item.action === "create") {
            const payload = JSON.parse(item.payloadJson) as CreateCalendarEventInput;
            const targetCalId =
              item.calendarId === "daily"
                ? (await ensureDailyCalendar(this.client, token)).id
                : item.calendarId;
            const created = await this.client.createEvent(token, targetCalId, payload);
            await deleteEventFromDb(item.eventId);
            await saveEventsToDb([created]);
            await removeOutboxItem(item.id);
            processed++;
            this.onMutationSynced?.("create", created.id);
          } else if (item.action === "update") {
            const patch = JSON.parse(item.payloadJson) as UpdateCalendarEventInput;
            const updated = await this.client.updateEvent(
              token,
              item.calendarId,
              item.eventId,
              patch,
              item.etag,
            );
            await saveEventsToDb([updated]);
            await removeOutboxItem(item.id);
            processed++;
            this.onMutationSynced?.("update", updated.id);
          } else if (item.action === "delete") {
            await this.client.deleteEvent(token, item.calendarId, item.eventId, item.etag);
            await deleteEventFromDb(item.eventId);
            await removeOutboxItem(item.id);
            processed++;
            this.onMutationSynced?.("delete", item.eventId);
          }
        } catch (err) {
          if (err instanceof GooglePreconditionFailedError) {
            conflicts++;
            await removeOutboxItem(item.id);
            try {
              const remote = await this.client.getEvent(token, item.calendarId, item.eventId);
              await saveEventsToDb([remote]);
              this.onConflictResolved?.(
                remote,
                "Event was modified remotely on Google Calendar. Remote version preserved.",
              );
            } catch {
              await deleteEventFromDb(item.eventId);
              this.onConflictResolved?.(
                null,
                "Event was deleted remotely on Google Calendar.",
              );
            }
          } else {
            failed++;
            const msg = err instanceof Error ? err.message : String(err);
            await updateOutboxItemError(item.id, msg);
            this.onError?.(err instanceof Error ? err : new Error(msg));
            this.scheduleRetry(item.attempts + 1);
            break; // Preserve FIFO ordering on transient network failure
          }
        }
      }
    } catch (err) {
      failed++;
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
    } finally {
      this.isFlushing = false;
    }

    return { processed, conflicts, failed };
  }

  private scheduleRetry(attempt: number): void {
    this.stopRetryTimer();
    const delayMs = Math.min(60_000, 1000 * Math.pow(2, Math.min(attempt, 6)));
    this.retryTimer = setTimeout(() => {
      void this.flushOutbox();
    }, delayMs);
  }

  stopRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
