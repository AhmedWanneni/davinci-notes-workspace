import { useSyncExternalStore } from "react";

const MAX_RECENT_ITEMS = 5;

let recentIds: readonly string[] = [];
const listeners = new Set<() => void>();

export function getRecentInsertIds(): readonly string[] {
  return recentIds;
}

export function recordRecentInsert(id: string): void {
  recentIds = [id, ...recentIds.filter((existingId) => existingId !== id)].slice(0, MAX_RECENT_ITEMS);
  for (const listener of listeners) {
    listener();
  }
}

export function clearRecentInserts(): void {
  recentIds = [];
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeRecentInserts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRecentInsertIds(): readonly string[] {
  return useSyncExternalStore(subscribeRecentInserts, getRecentInsertIds, getRecentInsertIds);
}
