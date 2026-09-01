import { describe, expect, it } from "vitest";
import { createJsonManifestStore } from "./manifestStore";

describe("JSON manifest store", () => {
  it("round-trips a manifest snapshot through the storage adapter", async () => {
    let value: string | undefined;
    const store = createJsonManifestStore({
      read: async () => value,
      write: async (next) => {
        value = next;
      },
    });
    const snapshot = {
      entries: [
        {
          path: "note.md",
          hash: "abc",
          size: 3,
          deviceClock: 1,
          deleted: false,
        },
      ],
      metadata: { "note.md": { size: 3, mtimeMs: 10 } },
    };

    expect(await store.load()).toBeUndefined();
    await store.save(snapshot);
    await expect(store.load()).resolves.toEqual(snapshot);
  });
});
