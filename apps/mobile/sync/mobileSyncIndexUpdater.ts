import type { IncrementalIndexUpdater } from "@app/sync-client";
import { removeNoteFromTagIndex, updateTagIndexForNote } from "@app/indexer";
import {
  getVaultIndexDb,
  persistNotesBatch,
  removeNotesBatch,
  withDbLock,
  withDbTransaction,
} from "../database";
import { defaultVaultIndexer } from "../indexer";
import { noteFromMarkdown } from "../indexer/noteFromMarkdown";
import type { MobileVaultStorageAdapter } from "../vault";

export class MobileSyncIndexUpdater implements IncrementalIndexUpdater {
  constructor(private readonly adapter: MobileVaultStorageAdapter) {}

  async upsert(path: string): Promise<void> {
    if (!path.endsWith(".md")) {
      // Non-markdown attachments do not occupy the notes / FTS5 index
      return;
    }

    try {
      const file = await this.adapter.readNote(path);
      const scan = await this.adapter.scanVault();
      const note = noteFromMarkdown(path, file.content, file.mtime, scan.notes);

      const db = await getVaultIndexDb();
      await withDbLock(() =>
        withDbTransaction(db, () => persistNotesBatch(db, [note])),
      );

      updateTagIndexForNote(defaultVaultIndexer.getTagIndex(), note);
    } catch {
      // Ignore if file was deleted before indexing
    }
  }

  async remove(path: string): Promise<void> {
    if (!path.endsWith(".md")) {
      return;
    }

    const db = await getVaultIndexDb();
    await withDbLock(() =>
      withDbTransaction(db, () => removeNotesBatch(db, [path])),
    );

    removeNoteFromTagIndex(defaultVaultIndexer.getTagIndex(), path);
  }
}
