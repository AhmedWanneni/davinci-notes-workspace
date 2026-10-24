import { describe, expect, it } from "vitest";
import type { ClipPayload } from "./ClipPayload.js";
import {
  isQueueEntryExpired,
  MAX_QUEUE_AGE_MS,
  MAX_QUEUE_BYTES,
  MAX_QUEUE_ENTRIES,
  type ClipQueueEntry,
} from "./ClipQueue.js";

const dummyPayload: ClipPayload = {
  version: 1,
  clipId: "test-clip-1",
  capturedAt: "2026-10-17T12:00:00Z",
  mode: "full",
  templateId: "article",
  behavior: "create",
  target: { folder: "Clippings", noteName: "Test.md" },
  source: { url: "https://example.com", title: "Test" },
  properties: {},
  tags: [],
  body: "# Test",
  contentHash: "hash-1",
};

describe("ClipQueue schema and helpers", () => {
  it("defines standard queue bounds", () => {
    expect(MAX_QUEUE_ENTRIES).toBe(200);
    expect(MAX_QUEUE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_QUEUE_AGE_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("evaluates expired queue entries accurately", () => {
    const now = 1770000000000;
    const freshEntry: ClipQueueEntry = {
      id: "q-1",
      clipId: "test-clip-1",
      payload: dummyPayload,
      queuedAt: new Date(now - 1000).toISOString(),
      attempts: 0,
    };
    expect(isQueueEntryExpired(freshEntry, now)).toBe(false);

    const staleEntry: ClipQueueEntry = {
      ...freshEntry,
      queuedAt: new Date(now - MAX_QUEUE_AGE_MS - 1000).toISOString(),
    };
    expect(isQueueEntryExpired(staleEntry, now)).toBe(true);

    const invalidDateEntry: ClipQueueEntry = {
      ...freshEntry,
      queuedAt: "not-a-date",
    };
    expect(isQueueEntryExpired(invalidDateEntry, now)).toBe(true);
  });
});
