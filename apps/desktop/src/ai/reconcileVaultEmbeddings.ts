import type { AIProvider } from "@app/ai-api";
import type { EmbeddingIndex } from "@app/ai-embeddings";
import { listNotes, noteFromMarkdown, readNote } from "../vault";

const BATCH_SIZE = 50;

/** Reads and embeds no more than 50 vault files at a time after vault open. */
export async function reconcileVaultEmbeddings(index: EmbeddingIndex, provider: AIProvider): Promise<void> {
  const paths = (await listNotes()).filter((path) => path.endsWith(".md"));
  for (let offset = 0; offset < paths.length; offset += BATCH_SIZE) {
    const batchPaths = paths.slice(offset, offset + BATCH_SIZE);
    const notes = await Promise.all(batchPaths.map(async (path) => {
      const file = await readNote(path);
      return noteFromMarkdown(path, file.content, file.mtime, paths);
    }));
    await index.updateNotes(notes, provider, BATCH_SIZE, false);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
