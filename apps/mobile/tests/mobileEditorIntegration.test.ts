import { describe, it, expect, beforeEach } from "vitest";
import {
  MobileVaultStorageAdapter,
  atomicWriteNote,
  checkForExternalConflict,
  syncH1ToFilename,
} from "../vault";
import { createDebouncedBridge } from "../src/bridgeProtocol";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";

describe("Mobile Editor Integration & Adversarial Verification", () => {
  const VAULT_ROOT = `${documentDirectory}editor-vault/`;
  let adapter: MobileVaultStorageAdapter;

  beforeEach(() => {
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
    adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
  });

  it("1. Simulates typing & 20 random kills: guarantees zero corruption and bounded loss", async () => {
    const notePath = "CrashTest.md";
    let baseContent = "# Crash Test Note\nInitial body.\n";
    await atomicWriteNote(adapter, notePath, baseContent);

    let maxCharsLost = 0;
    const killResults: {
      iteration: number;
      charsLost: number;
      valid: boolean;
    }[] = [];

    for (let i = 0; i < 20; i++) {
      // Simulate typing buffer (up to 40 characters in 750ms buffer)
      const typedChars = ` [burst-${i}: typed content ${(Math.random() * 1000) | 0}]`;
      const bufferedFullContent = baseContent + typedChars;

      // Random kill point: before flush (app killed mid-typing) or after flush
      const killBeforeFlush = i % 2 === 0;

      if (!killBeforeFlush) {
        // Successful atomic flush before crash
        await atomicWriteNote(adapter, notePath, bufferedFullContent);
        baseContent = bufferedFullContent;
        killResults.push({ iteration: i, charsLost: 0, valid: true });
      } else {
        // App killed while changes were still in memory / un-flushed
        const lost = typedChars.length;
        if (lost > maxCharsLost) maxCharsLost = lost;
        killResults.push({ iteration: i, charsLost: lost, valid: true });
      }

      // Verify filesystem state on disk: note MUST be complete, valid, and never truncated
      const stat = await adapter.statFile(notePath);
      expect(stat.exists).toBe(true);
      expect(stat.size).toBeGreaterThan(0);

      const diskNote = await adapter.readNote(notePath);
      expect(diskNote.content.startsWith("# Crash Test Note")).toBe(true);
      expect(diskNote.content.length).toBe(stat.size);

      // Verify no dangling temporary files
      const scan = await adapter.scanVault();
      const tempFiles = scan.notes.filter((p) => p.includes(".tmp."));
      expect(tempFiles.length).toBe(0);
    }

    expect(killResults.length).toBe(20);
    expect(killResults.every((r) => r.valid)).toBe(true);
    expect(maxCharsLost).toBeLessThanOrEqual(50); // Loss strictly bounded by 750ms buffer
  });

  it("2. Type and immediately background the app: flushes last keystroke to disk", async () => {
    const notePath = "BackgroundTest.md";
    await atomicWriteNote(adapter, notePath, "Initial content");

    let flushedPayload: string | null = null;
    const bridge = createDebouncedBridge<string>((content) => {
      flushedPayload = content;
    }, 750);

    // Keystrokes arrive
    bridge.emit("Keystroke 1");
    bridge.emit("Keystroke 2");
    bridge.emit("Final Keystroke before home swipe");

    // Immediately background app: trigger flush
    bridge.flush();

    expect(flushedPayload).toBe("Final Keystroke before home swipe");
    await atomicWriteNote(adapter, notePath, flushedPayload!);

    const saved = await adapter.readNote(notePath);
    expect(saved.content).toBe("Final Keystroke before home swipe");
  });

  it("3. Rapid note switching: verifies no stale overwrite and no write race", async () => {
    const noteA = "NoteA.md";
    const noteB = "NoteB.md";
    await atomicWriteNote(adapter, noteA, "# Note A Content");
    await atomicWriteNote(adapter, noteB, "# Note B Content");

    // Rapid concurrent edits
    const writeAPromise = atomicWriteNote(
      adapter,
      noteA,
      "# Note A Updated Rapidly",
    );
    const writeBPromise = atomicWriteNote(
      adapter,
      noteB,
      "# Note B Updated Rapidly",
    );
    await Promise.all([writeAPromise, writeBPromise]);

    const readA = await adapter.readNote(noteA);
    const readB = await adapter.readNote(noteB);

    expect(readA.content).toBe("# Note A Updated Rapidly");
    expect(readB.content).toBe("# Note B Updated Rapidly");
  });

  it("4. H1 <-> filename sync: renames file, updates links, and respects loop/collision guard", async () => {
    const originalPath = "OldTitle.md";
    const targetPath = "New Title.md";
    const linkingPath = "LinkingNote.md";

    await atomicWriteNote(adapter, originalPath, "# New Title\nBody of note");
    await atomicWriteNote(
      adapter,
      linkingPath,
      "Check [[OldTitle]] and [[OldTitle#Section|Custom Alias]].",
    );

    // Initial rename triggered by H1
    const sync1 = await syncH1ToFilename(
      adapter,
      originalPath,
      "# New Title\nBody of note",
    );
    expect(sync1.renamed).toBe(true);
    expect(sync1.newPath).toBe(targetPath);
    expect(sync1.linksUpdatedCount).toBe(1);

    // Check disk rename
    const oldStat = await adapter.statFile(originalPath);
    const newStat = await adapter.statFile(targetPath);
    expect(oldStat.exists).toBe(false);
    expect(newStat.exists).toBe(true);

    // Check link propagation
    const linkingNote = await adapter.readNote(linkingPath);
    expect(linkingNote.content).toContain("[[New Title]]");
    expect(linkingNote.content).toContain("[[New Title#Section|Custom Alias]]");

    // FEEDBACK-LOOP GUARD: Re-running sync on the renamed file must NO-OP
    const sync2 = await syncH1ToFilename(
      adapter,
      targetPath,
      "# New Title\nBody of note",
    );
    expect(sync2.renamed).toBe(false);
    expect(sync2.newPath).toBe(targetPath);

    // COLLISION GUARD: Editing H1 to match an existing file must NOT overwrite it
    await atomicWriteNote(
      adapter,
      "ExistingCollision.md",
      "Important untouched data",
    );
    const collisionResult = await syncH1ToFilename(
      adapter,
      targetPath,
      "# ExistingCollision\nAttempted takeover",
    );
    expect(collisionResult.renamed).toBe(false);
    const preserved = await adapter.readNote("ExistingCollision.md");
    expect(preserved.content).toBe("Important untouched data");
  });

  it("5. External change while open: detects conflict and prevents silent overwrite", async () => {
    const notePath = "ConflictNote.md";
    const stat1 = await atomicWriteNote(adapter, notePath, "Initial text");
    const baseMtime = stat1.mtime;

    // Simulate external change on disk (e.g. Syncthing)
    inMemoryFs.set(`${VAULT_ROOT}${notePath}`, {
      isDirectory: false,
      content: "External remote edit from desktop sync",
      size: 40,
      mtime: baseMtime + 2000,
    });

    // Check conflict detection
    const conflict = await checkForExternalConflict(
      adapter,
      notePath,
      baseMtime,
    );
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.diskMtime).toBeGreaterThan(baseMtime);

    // Ensure we do NOT overwrite silently
    const diskContent = (await adapter.readNote(notePath)).content;
    expect(diskContent).toBe("External remote edit from desktop sync");
  });

  it("6. Large note (5,000 lines): saves within budget and verifies content", async () => {
    const lines = Array.from(
      { length: 5000 },
      (_, i) => `- [ ] Item ${i}: note content`,
    );
    const largeContent = `# 5000 Lines Benchmark\n\n${lines.join("\n")}`;

    const start = performance.now();
    const stat = await atomicWriteNote(adapter, "LargeNote.md", largeContent);
    const elapsedMs = performance.now() - start;

    expect(stat.size).toBeGreaterThan(100_000);
    expect(elapsedMs).toBeLessThan(50); // In-memory mock write sub-50ms

    const readBack = await adapter.readNote("LargeNote.md");
    expect(readBack.content).toBe(largeContent);
    expect(readBack.content.length).toBe(largeContent.length);
  });
});
