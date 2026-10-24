import type { ClipPayload, ClipQueueEntry } from "@app/clipper-core";
import {
  isQueueEntryExpired,
  MAX_QUEUE_BYTES,
  MAX_QUEUE_ENTRIES,
} from "@app/clipper-core";
import type { StorageArea } from "../storage/storageArea";
import type { ClipperPairing } from "../pairing/pairingStore";
import type { ClipFetch } from "../transport/postClipToDesktop";
import { postClipToDesktop } from "../transport/postClipToDesktop";

export const QUEUE_STORAGE_KEY = "clipper.queue";

export interface DrainSummary {
  total: number;
  delivered: number;
  duplicates: number;
  remaining: number;
  stoppedReason?: string;
}

export async function loadQueuedClips(
  storage: StorageArea,
): Promise<ClipQueueEntry[]> {
  const result = await storage.get(QUEUE_STORAGE_KEY);
  const raw = result[QUEUE_STORAGE_KEY];
  if (!Array.isArray(raw)) return [];
  const entries = raw as ClipQueueEntry[];
  const valid = entries.filter((e) => !isQueueEntryExpired(e));
  if (valid.length !== entries.length) {
    await storage.set({ [QUEUE_STORAGE_KEY]: valid });
  }
  return valid;
}

export async function saveQueuedClips(
  storage: StorageArea,
  queue: ClipQueueEntry[],
): Promise<void> {
  await storage.set({ [QUEUE_STORAGE_KEY]: queue });
}

export async function enqueueClip(
  storage: StorageArea,
  payload: ClipPayload,
): Promise<{ queued: ClipQueueEntry[]; evictedCount: number }> {
  const queue = await loadQueuedClips(storage);
  let evictedCount = 0;

  const existingIndex = queue.findIndex((e) => e.clipId === payload.clipId);
  const newEntry: ClipQueueEntry = {
    id: crypto.randomUUID(),
    clipId: payload.clipId,
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = newEntry;
  } else {
    queue.push(newEntry);
  }

  // Enforce entry count bound
  while (queue.length > MAX_QUEUE_ENTRIES) {
    queue.shift();
    evictedCount += 1;
  }

  // Enforce byte size bound
  while (queue.length > 0) {
    const serialized = JSON.stringify(queue);
    if (new TextEncoder().encode(serialized).length <= MAX_QUEUE_BYTES) {
      break;
    }
    queue.shift();
    evictedCount += 1;
  }

  await saveQueuedClips(storage, queue);
  return { queued: queue, evictedCount };
}

export async function dequeueClip(
  storage: StorageArea,
  clipId: string,
): Promise<ClipQueueEntry[]> {
  const queue = await loadQueuedClips(storage);
  const filtered = queue.filter((e) => e.clipId !== clipId);
  await saveQueuedClips(storage, filtered);
  return filtered;
}

export async function clearQueue(storage: StorageArea): Promise<void> {
  await storage.set({ [QUEUE_STORAGE_KEY]: [] });
}

export async function drainQueue(
  storage: StorageArea,
  pairing: ClipperPairing | undefined,
  fetchImpl: ClipFetch,
): Promise<DrainSummary> {
  const queue = await loadQueuedClips(storage);
  if (queue.length === 0) {
    return { total: 0, delivered: 0, duplicates: 0, remaining: 0 };
  }

  if (pairing === undefined) {
    return {
      total: queue.length,
      delivered: 0,
      duplicates: 0,
      remaining: queue.length,
      stoppedReason: "not-paired",
    };
  }

  let delivered = 0;
  let duplicates = 0;
  let stoppedReason: string | undefined;

  const remainingQueue: ClipQueueEntry[] = [];
  const entriesToProcess = [...queue];

  for (let i = 0; i < entriesToProcess.length; i += 1) {
    const entry = entriesToProcess[i]!;

    if (stoppedReason) {
      remainingQueue.push(entry);
      continue;
    }

    const result = await postClipToDesktop(pairing, entry.payload, fetchImpl);
    if (result.delivered) {
      delivered += 1;
      continue;
    }

    if (result.reason === "duplicate") {
      duplicates += 1;
      continue;
    }

    entry.attempts += 1;
    entry.lastAttemptAt = new Date().toISOString();
    entry.lastError = result.reason;

    if (
      result.reason === "unreachable" ||
      result.reason === "timeout" ||
      result.reason === "vault-not-open" ||
      result.reason === "app-busy"
    ) {
      stoppedReason = result.reason;
    }

    remainingQueue.push(entry);
  }

  await saveQueuedClips(storage, remainingQueue);

  return {
    total: queue.length,
    delivered,
    duplicates,
    remaining: remainingQueue.length,
    stoppedReason,
  };
}
