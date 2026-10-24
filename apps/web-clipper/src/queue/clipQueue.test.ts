import { beforeEach, describe, expect, it } from "vitest";
import type { ClipPayload, ClipQueueEntry } from "@app/clipper-core";
import {
  clearQueue,
  dequeueClip,
  drainQueue,
  enqueueClip,
  loadQueuedClips,
  QUEUE_STORAGE_KEY,
} from "./clipQueue";
import type { StorageArea } from "../storage/storageArea";
import type { ClipperPairing } from "../pairing/pairingStore";
import type { ClipFetch } from "../transport/postClipToDesktop";

function createMemoryStorage(
  initial: Record<string, unknown> = {},
): StorageArea {
  const store: Record<string, unknown> = { ...initial };
  return {
    get: async (keys) => {
      if (typeof keys === "string") return { [keys]: store[keys] };
      return { ...store };
    },
    set: async (items) => {
      Object.assign(store, items);
    },
  };
}

function samplePayload(id: string = "clip-1"): ClipPayload {
  return {
    version: 1,
    clipId: id,
    capturedAt: "2026-10-17T12:00:00Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: `${id}.md` },
    source: { url: `https://example.com/${id}`, title: id },
    properties: {},
    tags: [],
    body: `# ${id}`,
    contentHash: `hash-${id}`,
  };
}

const pairing: ClipperPairing = { port: 54321, token: "token-secret" };

describe("clipQueue", () => {
  let storage: StorageArea;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("loads an empty queue by default", async () => {
    const queue = await loadQueuedClips(storage);
    expect(queue).toEqual([]);
  });

  it("enqueues clips and saves them to storage", async () => {
    const payload = samplePayload("c1");
    const { queued, evictedCount } = await enqueueClip(storage, payload);
    expect(queued).toHaveLength(1);
    expect(queued[0]?.clipId).toBe("c1");
    expect(evictedCount).toBe(0);

    const loaded = await loadQueuedClips(storage);
    expect(loaded).toHaveLength(1);
  });

  it("updates existing clip in queue rather than duplicating key", async () => {
    await enqueueClip(storage, samplePayload("c1"));
    const updated = samplePayload("c1");
    updated.body = "# Updated Body";
    await enqueueClip(storage, updated);

    const loaded = await loadQueuedClips(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.payload.body).toBe("# Updated Body");
  });

  it("evicts oldest clips when exceeding MAX_QUEUE_ENTRIES (200)", async () => {
    const existing: ClipQueueEntry[] = Array.from({ length: 200 }, (_, i) => ({
      id: `q-${i}`,
      clipId: `c-${i}`,
      payload: samplePayload(`c-${i}`),
      queuedAt: new Date().toISOString(),
      attempts: 0,
    }));
    await storage.set({ [QUEUE_STORAGE_KEY]: existing });

    const { queued, evictedCount } = await enqueueClip(
      storage,
      samplePayload("new-clip"),
    );
    expect(queued).toHaveLength(200);
    expect(evictedCount).toBe(1);
    expect(queued[0]?.clipId).toBe("c-1"); // c-0 evicted
    expect(queued[199]?.clipId).toBe("new-clip");
  });

  it("dequeues specific clip by id and clears queue", async () => {
    await enqueueClip(storage, samplePayload("c1"));
    await enqueueClip(storage, samplePayload("c2"));

    const remaining = await dequeueClip(storage, "c1");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.clipId).toBe("c2");

    await clearQueue(storage);
    expect(await loadQueuedClips(storage)).toEqual([]);
  });

  it("drains queued clips successfully and removes written & duplicate clips", async () => {
    await enqueueClip(storage, samplePayload("c1"));
    await enqueueClip(storage, samplePayload("c2"));
    await enqueueClip(storage, samplePayload("c3"));

    const mockFetch: ClipFetch = async (_url, init) => {
      const body = JSON.parse(init.body);
      if (body.clipId === "c1") {
        return {
          status: 200,
          json: async () => ({
            clipId: "c1",
            status: "written",
            path: "Clippings/c1.md",
          }),
        };
      }
      if (body.clipId === "c2") {
        return {
          status: 200,
          json: async () => ({
            clipId: "c2",
            status: "rejected",
            error: "duplicate",
          }),
        };
      }
      return {
        status: 409,
        json: async () => ({
          clipId: "c3",
          status: "rejected",
          error: "vault-not-open",
        }),
      };
    };

    const summary = await drainQueue(storage, pairing, mockFetch);
    expect(summary.total).toBe(3);
    expect(summary.delivered).toBe(1);
    expect(summary.duplicates).toBe(1);
    expect(summary.remaining).toBe(1);
    expect(summary.stoppedReason).toBe("vault-not-open");

    const remaining = await loadQueuedClips(storage);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.clipId).toBe("c3");
    expect(remaining[0]?.attempts).toBe(1);
    expect(remaining[0]?.lastError).toBe("vault-not-open");
  });
});
