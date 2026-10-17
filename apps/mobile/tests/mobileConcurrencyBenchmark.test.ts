import { describe, it, expect, beforeEach } from "vitest";
import { getVaultIndexDb, withDbLock, closeVaultIndexDb } from "../database";
import { MobileVaultStorageAdapter } from "../vault/MobileVaultStorageAdapter";
import { MobileVaultIndexer } from "../indexer/MobileVaultIndexer";
import { searchVault } from "../indexer/mobileSearch";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";

describe("Mobile SQLite Concurrency & 5,000-Note Indexing Benchmark", () => {
  const VAULT_ROOT = `${documentDirectory}concurrency-vault/`;

  beforeEach(async () => {
    await closeVaultIndexDb();
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
  });

  it("handles simultaneous searches, settings writes, and full re-index with zero SQLITE_BUSY", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    const indexer = new MobileVaultIndexer();

    // Seed 100 notes
    for (let i = 1; i <= 100; i++) {
      await adapter.writeNote(
        `Note_${i}.md`,
        `---\ntags: [tag_${i % 5}]\n---\n# Note ${i}\nConcurrent content search term ${i}`,
      );
    }

    // Initial baseline index
    await indexer.indexVault(adapter);
    const db = await getVaultIndexDb();

    // Launch simultaneous operations:
    // 1. Full re-index in background
    const reindexPromise = indexer.indexVault(adapter, true);

    // 2. Continuous settings writes
    const settingsPromise = Promise.all(
      Array.from({ length: 20 }, (_, idx) =>
        withDbLock(async () => {
          await db.runAsync(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            `setting_${idx}`,
            `val_${idx}`,
          );
        }),
      ),
    );

    // 3. Concurrent searches
    const searchPromise = Promise.all(
      Array.from({ length: 20 }, (_, idx) =>
        searchVault(`term ${idx + 1}`, indexer.getTagIndex()),
      ),
    );

    // All must complete cleanly with zero unhandled rejections and zero SQLITE_BUSY
    const [reindexRes, _settingsRes, searchRes] = await Promise.all([
      reindexPromise,
      settingsPromise,
      searchPromise,
    ]);

    expect(reindexRes.indexedCount).toBe(100);
    expect(searchRes.length).toBe(20);

    // Verify settings rows persisted
    const settingsRows = await withDbLock(() =>
      db.getAllAsync<{ key: string }>("SELECT key FROM settings"),
    );
    expect(settingsRows.length).toBe(20);
  });

  it("recovers without corruption when indexing is interrupted mid-pass", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    const indexer = new MobileVaultIndexer();

    for (let i = 1; i <= 60; i++) {
      await adapter.writeNote(`Doc_${i}.md`, `# Document ${i}\nData ${i}`);
    }

    // Simulate crash after first batch of 50 by canceling or interrupting
    let batchCount = 0;
    try {
      await indexer.indexVault(adapter, false, (progress) => {
        batchCount++;
        if (progress.processed >= 50) {
          throw new Error("SIMULATED_APP_KILL_MID_INDEX");
        }
      });
    } catch (err: unknown) {
      expect((err as Error).message).toBe("SIMULATED_APP_KILL_MID_INDEX");
    }

    expect(batchCount).toBeGreaterThanOrEqual(1);

    // Relaunch app: new indexer instance picks up and finishes cleanly
    const freshIndexer = new MobileVaultIndexer();
    const recoveryRes = await freshIndexer.indexVault(adapter, false);

    expect(recoveryRes.indexedCount).toBe(60);

    // Verify all 60 notes searchable
    const searchRes = await searchVault("Document", freshIndexer.getTagIndex());
    expect(searchRes.length).toBe(60);
  });

  it("converges cleanly when a file is edited externally during indexing", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    const indexer = new MobileVaultIndexer();

    for (let i = 1; i <= 30; i++) {
      await adapter.writeNote(`Note_${i}.md`, `# Title ${i}\nInitial content`);
    }

    await indexer.indexVault(adapter);

    // Modify Note_5 externally
    await adapter.writeNote(
      "Note_5.md",
      "# Title 5\nBrand New Converged Content",
    );

    // Incremental index
    const res = await indexer.indexVault(adapter);
    expect(res.indexedCount).toBe(1);

    const hits = await searchVault("Converged", indexer.getTagIndex());
    expect(hits.length).toBe(1);
    expect(hits[0].path).toBe("Note_5.md");
  });

  it(
    "indexes a 5,000-note vault and reports first-index, incremental re-index, and p50/p95 latency",
    { timeout: 30000 },
    async () => {
      const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
      const indexer = new MobileVaultIndexer();

      // 1. Seed 50 folders and 5,000 notes
      for (let f = 1; f <= 50; f++) {
        inMemoryFs.set(`${VAULT_ROOT}Folder_${f}`, {
          isDirectory: true,
          size: 0,
          mtime: Date.now() - 10000,
        });
      }

      const NOTE_COUNT = 5000;
      for (let i = 1; i <= NOTE_COUNT; i++) {
        const folder = `Folder_${(i % 50) + 1}`;
        const path = `${folder}/Note_${i}.md`;
        inMemoryFs.set(`${VAULT_ROOT}${path}`, {
          isDirectory: false,
          content: `# Note ${i}\nFull text search content item with keywords index and search speed.`,
          size: 75,
          mtime: Date.now() - i,
        });
      }

      // 2. First-index time
      const memBefore = process.memoryUsage().heapUsed;
      const firstIndexRes = await indexer.indexVault(adapter, true);
      const memAfter = process.memoryUsage().heapUsed;
      const memDeltaMb = (memAfter - memBefore) / (1024 * 1024);

      expect(firstIndexRes.indexedCount).toBe(5000);
      expect(firstIndexRes.elapsedMs).toBeGreaterThan(0);

      // 3. Incremental re-index after editing 1 note
      inMemoryFs.set(`${VAULT_ROOT}Folder_1/Note_1.md`, {
        isDirectory: false,
        content:
          "# Note 1\nUpdated unique single note edit text for fast incremental pass.",
        size: 78,
        mtime: Date.now() + 5000,
      });

      const incRes = await indexer.indexVault(adapter, false);
      expect(incRes.indexedCount).toBe(1);
      expect(incRes.elapsedMs).toBeLessThan(250); // Incremental check under test load

      // 4. Search Latency Benchmark (50 queries)
      const latencies: number[] = [];
      for (let q = 0; q < 50; q++) {
        const t0 = performance.now();
        await searchVault("keywords", indexer.getTagIndex());
        latencies.push(performance.now() - t0);
      }

      latencies.sort((a, b) => a - b);
      const p50 = latencies[Math.floor(latencies.length * 0.5)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];

      expect(p50).toBeLessThan(60);
      expect(p95).toBeLessThan(100);
      expect(memDeltaMb).toBeLessThan(45);
    },
  );
});
