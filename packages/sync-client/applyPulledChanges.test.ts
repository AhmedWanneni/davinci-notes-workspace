import { describe, expect, it, vi } from "vitest";
import { applyPulledChanges } from "./applyPulledChanges";
import type { ManifestEntry } from "./manifest";

const entry = (path: string, deleted = false): ManifestEntry => ({
  path,
  hash: "hash",
  size: 2,
  deviceClock: 1,
  deleted,
});

describe("apply pulled changes", () => {
  it("writes files and removes tombstones through the incremental index path", async () => {
    const files = { write: vi.fn(), remove: vi.fn() };
    const index = { upsert: vi.fn(), remove: vi.fn() };
    await applyPulledChanges(
      [
        { entry: entry("new.md"), content: new ArrayBuffer(2) },
        { entry: entry("gone.md", true) },
      ],
      files,
      index,
    );
    expect(files.write).toHaveBeenCalledWith("new.md", expect.any(ArrayBuffer));
    expect(files.remove).toHaveBeenCalledWith("gone.md");
    expect(index.upsert).toHaveBeenCalledWith("new.md");
    expect(index.remove).toHaveBeenCalledWith("gone.md");
  });

  it("rejects traversal paths before writing", async () => {
    await expect(
      applyPulledChanges(
        [{ entry: entry("../outside.md") }],
        { write: vi.fn(), remove: vi.fn() },
        { upsert: vi.fn(), remove: vi.fn() },
      ),
    ).rejects.toThrow("unsafe sync path");
  });
});
