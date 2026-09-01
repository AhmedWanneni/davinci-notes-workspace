import { describe, expect, it, vi } from "vitest";
import {
  currentManifestEntries,
  generateManifest,
  type ManifestSource,
} from "./manifest";

function source(
  files: { path: string; size: number; mtimeMs: number; hash: string }[],
): ManifestSource {
  return {
    listFiles: async () => files,
    hashFile: vi.fn(
      async (path: string) => files.find((file) => file.path === path)!.hash,
    ),
  };
}

describe("manifest generation", () => {
  it("builds a complete bootstrap manifest for every file", async () => {
    const result = await generateManifest(
      source([
        { path: "notes/b.md", size: 2, mtimeMs: 2, hash: "b-hash" },
        { path: "notes/a.md", size: 1, mtimeMs: 1, hash: "a-hash" },
      ]),
    );
    expect(result.entries).toEqual([
      {
        path: "notes/a.md",
        hash: "a-hash",
        size: 1,
        deviceClock: 1,
        deleted: false,
      },
      {
        path: "notes/b.md",
        hash: "b-hash",
        size: 2,
        deviceClock: 2,
        deleted: false,
      },
    ]);
  });

  it("skips unchanged files and re-hashes size or mtime changes", async () => {
    const hashFile = vi.fn(async () => "changed");
    const result = await generateManifest(
      {
        listFiles: async () => [
          { path: "same", size: 1, mtimeMs: 1 },
          { path: "size", size: 2, mtimeMs: 1 },
          { path: "mtime", size: 1, mtimeMs: 2 },
        ],
        hashFile,
      },
      {
        entries: [
          {
            path: "same",
            hash: "old-same",
            size: 1,
            deviceClock: 3,
            deleted: false,
          },
          {
            path: "size",
            hash: "old-size",
            size: 1,
            deviceClock: 4,
            deleted: false,
          },
          {
            path: "mtime",
            hash: "old-mtime",
            size: 1,
            deviceClock: 5,
            deleted: false,
          },
        ],
        metadata: {
          same: { size: 1, mtimeMs: 1 },
          size: { size: 1, mtimeMs: 1 },
          mtime: { size: 1, mtimeMs: 1 },
        },
      },
      5,
    );
    expect(hashFile).toHaveBeenCalledTimes(2);
    expect(result.entries.find((entry) => entry.path === "same")?.hash).toBe(
      "old-same",
    );
    expect(result.entries.find((entry) => entry.path === "size")?.hash).toBe(
      "changed",
    );
    expect(result.entries.find((entry) => entry.path === "mtime")?.hash).toBe(
      "changed",
    );
  });

  it("retains deleted files as tombstones but excludes them from current entries", async () => {
    const result = await generateManifest(
      source([]),
      {
        entries: [
          {
            path: "gone.md",
            hash: "gone-hash",
            size: 4,
            deviceClock: 2,
            deleted: false,
          },
        ],
        metadata: { "gone.md": { size: 4, mtimeMs: 8 } },
      },
      2,
    );
    expect(result.entries[0]).toEqual({
      path: "gone.md",
      hash: "gone-hash",
      size: 4,
      deviceClock: 3,
      deleted: true,
    });
    expect(currentManifestEntries(result.entries)).toEqual([]);
  });

  it("keeps existing tombstones during incremental generation", async () => {
    const result = await generateManifest(
      source([]),
      {
        entries: [
          {
            path: "gone.md",
            hash: "gone-hash",
            size: 4,
            deviceClock: 3,
            deleted: true,
          },
        ],
        metadata: {},
      },
      3,
    );
    expect(result.entries[0]?.deleted).toBe(true);
    expect(result.nextDeviceClock).toBe(3);
  });

  it("keeps the existing 350-note fixture-scale manifest pass bounded", async () => {
    const files = Array.from({ length: 350 }, (_, index) => ({
      path: `notes/note-${String(index).padStart(4, "0")}.md`,
      size: 100,
      mtimeMs: index,
      hash: `hash-${index}`,
    }));
    const started = performance.now();
    await generateManifest(source(files));
    const elapsed = performance.now() - started;
    console.info(`manifest fixture-scale generation: ${elapsed.toFixed(2)} ms`);
    expect(elapsed).toBeLessThan(1000);
  });

  it("supports an explicit full re-hash pass for mtime-preserving edits", async () => {
    const hashFile = vi.fn(async () => "fresh");
    await generateManifest(
      {
        listFiles: async () => [{ path: "same", size: 1, mtimeMs: 1 }],
        hashFile,
      },
      {
        entries: [
          {
            path: "same",
            hash: "old",
            size: 1,
            deviceClock: 1,
            deleted: false,
          },
        ],
        metadata: { same: { size: 1, mtimeMs: 1 } },
      },
      1,
      { forceRehash: true },
    );
    expect(hashFile).toHaveBeenCalledOnce();
  });
});
