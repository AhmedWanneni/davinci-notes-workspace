import type { ClipPayload } from "./ClipPayload.js";

/** Max clips retained in the extension offline queue (ADR-0178). */
export const MAX_QUEUE_ENTRIES = 200;

/** Max serialized size for the offline queue (5 MiB). */
export const MAX_QUEUE_BYTES = 5 * 1024 * 1024;

/** Max age before an un-synced clip is expired (30 days in ms). */
export const MAX_QUEUE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface ClipQueueEntry {
  /** Unique queue record identifier (UUID). */
  id: string;
  /** Correlates to `payload.clipId`. */
  clipId: string;
  /** Full payload to deliver upon desktop reconnect. */
  payload: ClipPayload;
  /** ISO timestamp when the clip was added to the queue. */
  queuedAt: string;
  /** Delivery attempts so far. */
  attempts: number;
  /** Timestamp of the most recent delivery attempt. */
  lastAttemptAt?: string;
  /** Last error reason returned by the transport. */
  lastError?: string;
}

/**
 * Checks if a queued clip has exceeded the 30-day age limit.
 */
export function isQueueEntryExpired(
  entry: ClipQueueEntry,
  nowMs: number = Date.now(),
): boolean {
  const queuedTime = new Date(entry.queuedAt).getTime();
  if (Number.isNaN(queuedTime)) return true;
  return nowMs - queuedTime > MAX_QUEUE_AGE_MS;
}
