import type { AIProvider } from "@app/ai-api";
import type { Note } from "@app/core-types";
import { chunkNote, type NoteChunk } from "./chunkNote";
import type { EmbeddingStore, StoredEmbedding } from "./EmbeddingStore";

export interface EmbeddingHash {
  (value: string): Promise<string>;
}

export interface EmbeddingUpdate {
  regenerated: string[];
  removed: string[];
}

export class EmbeddingIndex {
  private readonly entries = new Map<string, StoredEmbedding>();

  constructor(private readonly hash: EmbeddingHash, private readonly store?: EmbeddingStore) {}

  snapshot(): readonly StoredEmbedding[] {
    return [...this.entries.values()];
  }

  async updateNotes(
    notes: readonly Note[],
    provider: AIProvider,
    batchSize = 50,
  ): Promise<EmbeddingUpdate> {
    const next = new Map<string, NoteChunk>();
    for (const note of notes) {
      for (const chunk of chunkNote(note.path, note.content)) next.set(chunk.id, chunk);
    }
    const regenerated: string[] = [];
    const pending: Array<{ chunk: NoteChunk; hash: string }> = [];
    for (const chunk of next.values()) {
      const contentHash = await this.hash(chunk.text);
      const old = this.entries.get(chunk.id);
      if (!old || old.contentHash !== contentHash) pending.push({ chunk, hash: contentHash });
    }
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      const response = await provider.embed({ inputs: batch.map((item) => item.chunk.text) });
      for (const [index, item] of batch.entries()) {
        this.entries.set(item.chunk.id, {
          chunk: item.chunk,
          contentHash: item.hash,
          vector: response.vectors[index],
          model: response.model,
        });
        await this.store?.upsert(this.entries.get(item.chunk.id)!);
        regenerated.push(item.chunk.id);
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    const removed = [...this.entries.keys()].filter((id) => !next.has(id));
    await Promise.all(removed.map(async (id) => {
      this.entries.delete(id);
      await this.store?.remove(id);
    }));
    return { regenerated, removed };
  }
}

export async function hashText(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
