import { describe, expect, it, vi } from "vitest";
import { SqliteEmbeddingStore, cosine, type SqliteLike } from "./EmbeddingStore";

describe("SqliteEmbeddingStore", () => {
  it("packs vectors for SQLite and ranks rows by cosine similarity", async () => {
    const select = vi.fn(async () => [
      { chunk_id: "near", note_path: "a.md", heading: null, start_line: 1, end_line: 1,
        content_hash: "a", model: "m", vector: new Uint8Array(new Float32Array([1, 0]).buffer) },
      { chunk_id: "far", note_path: "b.md", heading: null, start_line: 1, end_line: 1,
        content_hash: "b", model: "m", vector: new Uint8Array(new Float32Array([0, 1]).buffer) },
    ]);
    const db: SqliteLike = {
      execute: vi.fn(async () => undefined),
      select: select as SqliteLike["select"],
    };
    const store = new SqliteEmbeddingStore(db, async (work) => work());
    await store.upsert({
      chunk: { id: "new", notePath: "new.md", heading: "H", startLine: 1, endLine: 2, text: "x" },
      contentHash: "hash", model: "m", vector: [1, 0],
    });
    const params = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0][1] as unknown[];
    expect(params[7]).toBeInstanceOf(Uint8Array);
    expect(await store.querySimilar([1, 0], 1)).toMatchObject([{ chunk: { id: "near" } }]);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });

  it("benchmarks application-side ranking at the 350-chunk fixture scale", async () => {
    const rows = Array.from({ length: 350 }, (_, index) => ({
      chunk_id: `chunk-${index}`, note_path: `notes/note-${index}.md`, heading: "Note",
      start_line: 1, end_line: 3, content_hash: String(index), model: "fixture",
      vector: new Uint8Array(new Float32Array([index === 17 ? 1 : 0, index === 17 ? 0 : 1]).buffer),
    }));
    const db: SqliteLike = {
      execute: vi.fn(async () => undefined),
      select: vi.fn(async () => rows) as SqliteLike["select"],
    };
    const started = performance.now();
    const result = await new SqliteEmbeddingStore(db, async (work) => work()).querySimilar([1, 0], 20);
    const elapsed = performance.now() - started;
    console.info(`350-chunk cosine query: ${elapsed.toFixed(2)} ms`);
    expect(result[0].chunk.id).toBe("chunk-17");
    expect(elapsed).toBeLessThan(5);
  });
});
