import { describe, expect, it, vi } from "vitest";
import { generateManifest, type ManifestSource } from "./manifest";
import { classifySyncDiff } from "./syncDiff";
import {
  isTextMergeable,
  resolveTextConflict,
  resolveBinaryConflictName,
} from "./conflictResolver";
import type { ManifestEntry } from "./manifest";

describe("Phase 7 — Sync Regression & Performance Pass", () => {
  it("verifies fast-path skip on incremental manifest generation (0 re-hashes)", async () => {
    const files = Array.from({ length: 350 }, (_, i) => ({
      path: `notes/note-${String(i).padStart(4, "0")}.md`,
      size: 250,
      mtimeMs: 10000 + i,
      hash: `blake3-hash-${i}`,
    }));

    // Step 1: Initial bootstrap manifest generation
    const hashFileFn = vi.fn(async (path: string) => {
      const found = files.find((f) => f.path === path);
      return found ? found.hash : "unknown-hash";
    });

    const bootstrapSource: ManifestSource = {
      listFiles: async () => files,
      hashFile: hashFileFn,
    };

    const bootstrapManifest = await generateManifest(bootstrapSource);
    expect(bootstrapManifest.entries.length).toBe(350);
    expect(hashFileFn).toHaveBeenCalledTimes(350);

    // Step 2: Incremental fast-path pass (no file modifications)
    const incrementalHashFn = vi.fn(async () => "re-hashed");
    const incrementalSource: ManifestSource = {
      listFiles: async () => files,
      hashFile: incrementalHashFn,
    };

    const startTime = performance.now();
    const incrementalManifest = await generateManifest(
      incrementalSource,
      bootstrapManifest,
      bootstrapManifest.nextDeviceClock,
    );
    const elapsedMs = performance.now() - startTime;

    // Fast-path skip: 0 re-hashes performed, completed in < 50 ms
    expect(incrementalHashFn).toHaveBeenCalledTimes(0);
    expect(incrementalManifest.entries.length).toBe(350);
    expect(elapsedMs).toBeLessThan(50);
  });

  it("classifies 350-item large vault three-way diff in under 10 ms", () => {
    const baseEntries: ManifestEntry[] = Array.from(
      { length: 350 },
      (_, i) => ({
        path: `notes/note-${i}.md`,
        hash: `hash-base-${i}`,
        size: 100,
        deviceClock: 1,
        deleted: false,
      }),
    );

    const localEntries: ManifestEntry[] = [
      ...baseEntries,
      {
        path: "notes/local-new.md",
        hash: "hash-local-new",
        size: 120,
        deviceClock: 2,
        deleted: false,
      },
    ];

    const remoteEntries: ManifestEntry[] = [
      ...baseEntries,
      {
        path: "notes/remote-new.md",
        hash: "hash-remote-new",
        size: 150,
        deviceClock: 2,
        deleted: false,
      },
    ];

    const startTime = performance.now();
    const diffs = classifySyncDiff(localEntries, baseEntries, remoteEntries);
    const elapsedMs = performance.now() - startTime;

    const pushes = diffs.filter((d) => d.classification === "push");
    const pulls = diffs.filter((d) => d.classification === "pull");
    const conflicts = diffs.filter((d) => d.classification === "conflict");

    expect(pushes.length).toBe(1);
    expect(pulls.length).toBe(1);
    expect(conflicts.length).toBe(0);
    expect(elapsedMs).toBeLessThan(10);
  });

  it("verifies multi-asset format sync (.canvas, .png, .jpg, .pdf, .md)", () => {
    expect(isTextMergeable("notes/daily.md")).toBe(true);
    expect(isTextMergeable("diagram.canvas")).toBe(false);
    expect(isTextMergeable("attachments/image.png")).toBe(false);
    expect(isTextMergeable("attachments/photo.jpg")).toBe(false);
    expect(isTextMergeable("documents/paper.pdf")).toBe(false);

    // Canvas file simultaneous edit resolves to atomic copy without JSON corruption
    const canvasCopy = resolveBinaryConflictName({
      path: "architecture.canvas",
      remoteDeviceName: "iPad",
      existingPaths: ["architecture.canvas"],
    });

    expect(canvasCopy.kind).toBe("binary-copy");
    expect(canvasCopy.copyPath).toBe("architecture (iPad copy).canvas");

    // Text file diff3 merge
    const textMerge = resolveTextConflict({
      path: "notes/daily.md",
      baseContent: "Header\nShared Line\nFooter",
      localContent: "Header\nLocal Line\nFooter",
      remoteContent: "Header\nRemote Line\nFooter",
    });

    expect(textMerge.hasConflict).toBe(true);
    expect(textMerge.mergedContent).toContain("<<<<<<<");
    expect(textMerge.mergedContent).toContain(">>>>>>>");

    // Binary file conflict produces device copy name
    const binaryCopy = resolveBinaryConflictName({
      path: "attachments/diagram.png",
      remoteDeviceName: "iPad",
      existingPaths: ["attachments/diagram.png"],
    });

    expect(binaryCopy.kind).toBe("binary-copy");
    expect(binaryCopy.copyPath).toBe("attachments/diagram (iPad copy).png");
  });
});
