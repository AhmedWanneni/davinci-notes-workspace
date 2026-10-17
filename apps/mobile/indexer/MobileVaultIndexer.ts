import type { Note } from "@app/core-types";
import {
  createEmptyTagIndex,
  removeNoteFromTagIndex,
  updateTagIndexForNote,
  type TagIndex,
} from "@app/indexer";
import {
  getVaultIndexDb,
  withDbLock,
  withDbTransaction,
  clearVaultIndex,
  persistNotesBatch,
  removeNotesBatch,
} from "../database";
import type { MobileVaultStorageAdapter } from "../vault/MobileVaultStorageAdapter";
import { noteFromMarkdown } from "./noteFromMarkdown";

export interface IndexerProgress {
  processed: number;
  total: number;
  isComplete: boolean;
}

export class MobileVaultIndexer {
  private indexedCache = new Map<string, { mtime: number; size: number }>();
  private tagIndex: TagIndex = createEmptyTagIndex();
  private isIndexing = false;

  getTagIndex(): TagIndex {
    return this.tagIndex;
  }

  isBusy(): boolean {
    return this.isIndexing;
  }

  async indexVault(
    adapter: MobileVaultStorageAdapter,
    fullReindex = false,
    onProgress?: (progress: IndexerProgress) => void,
  ): Promise<{ indexedCount: number; elapsedMs: number }> {
    const started = performance.now();
    this.isIndexing = true;

    try {
      const scan = await adapter.scanVault();
      const db = await getVaultIndexDb();

      if (fullReindex) {
        this.indexedCache.clear();
        this.tagIndex = createEmptyTagIndex();
        await withDbLock(() =>
          withDbTransaction(db, () => clearVaultIndex(db)),
        );
      }

      // 1. Identify removed files
      const currentNotePaths = new Set(scan.notes);
      const removedPaths: string[] = [];
      for (const cachedPath of this.indexedCache.keys()) {
        if (!currentNotePaths.has(cachedPath)) {
          removedPaths.push(cachedPath);
        }
      }

      if (removedPaths.length > 0) {
        await withDbLock(() =>
          withDbTransaction(db, () => removeNotesBatch(db, removedPaths)),
        );
        for (const p of removedPaths) {
          this.indexedCache.delete(p);
          removeNoteFromTagIndex(this.tagIndex, p);
        }
      }

      // 2. Identify new or modified files
      const toIndexPaths: string[] = [];
      for (const notePath of scan.notes) {
        const stat = scan.stats[notePath];
        const cached = this.indexedCache.get(notePath);
        if (
          !cached ||
          cached.mtime !== stat?.mtime ||
          cached.size !== stat?.size
        ) {
          toIndexPaths.push(notePath);
        }
      }

      // 3. Process new/modified notes in non-blocking batches of 50
      const BATCH_SIZE = 50;
      let processed = 0;

      for (let i = 0; i < toIndexPaths.length; i += BATCH_SIZE) {
        const chunkPaths = toIndexPaths.slice(i, i + BATCH_SIZE);
        const parsedNotes: Note[] = [];

        for (const path of chunkPaths) {
          try {
            const file = await adapter.readNote(path);
            const note = noteFromMarkdown(
              path,
              file.content,
              file.mtime,
              scan.notes,
            );
            parsedNotes.push(note);
          } catch {
            // File might have been deleted mid-scan
          }
        }

        if (parsedNotes.length > 0) {
          await withDbLock(() =>
            withDbTransaction(db, () => persistNotesBatch(db, parsedNotes)),
          );

          for (const note of parsedNotes) {
            this.indexedCache.set(note.path, {
              mtime: note.mtime,
              size: scan.stats[note.path]?.size ?? 0,
            });
            updateTagIndexForNote(this.tagIndex, note);
          }
        }

        processed += chunkPaths.length;
        if (onProgress) {
          onProgress({
            processed,
            total: toIndexPaths.length,
            isComplete: false,
          });
        }

        // Cooperative yielding: allow UI and other events to process between chunks
        if (i + BATCH_SIZE < toIndexPaths.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (onProgress) {
        onProgress({
          processed: toIndexPaths.length,
          total: toIndexPaths.length,
          isComplete: true,
        });
      }

      return {
        indexedCount: toIndexPaths.length,
        elapsedMs: performance.now() - started,
      };
    } finally {
      this.isIndexing = false;
    }
  }
}

export const defaultVaultIndexer = new MobileVaultIndexer();
