import type { NoteChunk } from "./chunkNote";

export interface StoredEmbedding {
  chunk: NoteChunk;
  contentHash: string;
  vector: number[];
  model: string;
  similarity?: number;
}

export interface EmbeddingStore {
  upsert(embedding: StoredEmbedding): Promise<void>;
  remove(chunkId: string): Promise<void>;
}

export interface SqliteLike {
  execute(sql: string, bindValues?: unknown[]): Promise<unknown>;
  select<T>(sql: string, bindValues?: unknown[]): Promise<T[]>;
}

export type SqliteWriteLock = <T>(work: () => Promise<T>) => Promise<T>;

interface EmbeddingRow {
  chunk_id: string;
  note_path: string;
  heading: string | null;
  start_line: number;
  end_line: number;
  content_hash: string;
  model: string;
  vector: Uint8Array | number[];
  text: string;
}

function vectorBytes(vector: number[]): Uint8Array {
  return new Uint8Array(new Float32Array(vector).buffer);
}

function vectorValues(value: Uint8Array | number[]): number[] {
  if (Array.isArray(value)) return value;
  return [...new Float32Array(value.buffer, value.byteOffset, value.byteLength / 4)];
}

export class SqliteEmbeddingStore implements EmbeddingStore {
  constructor(
    private readonly db: SqliteLike,
    private readonly writeLock?: SqliteWriteLock,
  ) {}

  async upsert(embedding: StoredEmbedding): Promise<void> {
    if (!this.writeLock) {
      throw new Error("SqliteEmbeddingStore.upsert requires the shared database write lock");
    }
    const { chunk } = embedding;
    await this.writeLock(() =>
      this.db.execute(
        `INSERT INTO embedding_chunks
         (chunk_id, note_path, heading, start_line, end_line, content_hash, model, vector, updated_at, text)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT(chunk_id) DO UPDATE SET note_path=excluded.note_path,
         heading=excluded.heading,start_line=excluded.start_line,end_line=excluded.end_line,
         content_hash=excluded.content_hash,model=excluded.model,vector=excluded.vector,
         updated_at=excluded.updated_at,text=excluded.text`,
        [chunk.id, chunk.notePath, chunk.heading, chunk.startLine, chunk.endLine,
          embedding.contentHash, embedding.model, vectorBytes(embedding.vector), Date.now(), chunk.text],
      ),
    );
  }

  async remove(chunkId: string): Promise<void> {
    if (!this.writeLock) {
      throw new Error("SqliteEmbeddingStore.remove requires the shared database write lock");
    }
    await this.writeLock(() =>
      this.db.execute("DELETE FROM embedding_chunks WHERE chunk_id = $1", [chunkId]),
    );
  }

  async querySimilar(vector: number[], limit = 20): Promise<StoredEmbedding[]> {
    const rows = await this.db.select<EmbeddingRow>("SELECT * FROM embedding_chunks");
    return rows
      .map((row) => ({
        chunk: { id: row.chunk_id, notePath: row.note_path, heading: row.heading,
          startLine: row.start_line, endLine: row.end_line, text: row.text },
        contentHash: row.content_hash, model: row.model, vector: vectorValues(row.vector),
      }))
      .map((entry) => ({ entry: { ...entry, similarity: cosine(vector, entry.vector) }, score: cosine(vector, entry.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ entry }) => entry);
  }
}

export function cosine(left: readonly number[], right: readonly number[]): number {
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    dot += left[i] * right[i]; leftNorm += left[i] ** 2; rightNorm += right[i] ** 2;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}
