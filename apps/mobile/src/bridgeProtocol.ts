/**
 * Bridge communication protocol between the native React Native container
 * and the Expo DOM component ("use dom") webview.
 *
 * Strict constraint: Full document text NEVER crosses the bridge on typing.
 * Only debounced change notifications (doc length, revision counter, excerpt)
 * cross the bridge.
 */

export type ToolbarActionType =
  | "wikilink"
  | "link"
  | "tag"
  | "checkbox"
  | "indent"
  | "outdent"
  | "undo"
  | "redo";

export interface DocChangeNotification {
  docLength: number;
  changeCount: number;
  excerpt: string;
  timestamp: number;
}

export function measurePayloadSize(payload: unknown): number {
  try {
    const json = JSON.stringify(payload);
    return new TextEncoder().encode(json).length;
  } catch {
    return 0;
  }
}

export function createDebouncedBridge<T>(
  callback: (payload: T, sizeBytes: number) => void,
  delayMs = 300,
): {
  emit: (payload: T) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingPayload: T | null = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pendingPayload !== null) {
      const payload = pendingPayload;
      pendingPayload = null;
      const size = measurePayloadSize(payload);
      callback(payload, size);
    }
  };

  const emit = (payload: T) => {
    pendingPayload = payload;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(flush, delayMs);
  };

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingPayload = null;
  };

  return { emit, flush, cancel };
}
