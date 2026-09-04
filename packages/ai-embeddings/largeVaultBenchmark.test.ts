import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AIProvider } from "@app/ai-api";
import type { Note } from "@app/core-types";
import { describe, expect, it, vi } from "vitest";
import { EmbeddingIndex, hashText } from "./EmbeddingIndex";

const root = resolve(process.cwd(), "../indexer/fixtures/large-vault/notes");
const provider = (): AIProvider => ({
  id: "fixture", mode: "cloud", capabilities: new Set(["embeddings"]),
  embed: vi.fn(async ({ inputs }) => ({ vectors: inputs.map(() => [1, 0, 0]), model: "fixture" })),
  complete: vi.fn(), dispose: vi.fn(async () => {}),
});

describe("large vault embedding batch", () => {
  it("keeps the event loop available while indexing the real 350-file fixture", async () => {
    const paths = (await import("node:fs/promises")).readdir(root);
    const names = (await paths).filter((name) => name.endsWith(".md"));
    const notes: Note[] = await Promise.all(names.map(async (name) => ({
      path: name, title: name, content: await readFile(resolve(root, name), "utf8"), frontmatter: {}, outlinks: [],
      tags: { frontmatter: [], inline: [], all: [] }, mtime: 1,
    })));
    const index = new EmbeddingIndex(hashText);
    const started = performance.now();
    const latency = new Promise<number>((resolveLatency) => setTimeout(() => resolveLatency(performance.now() - started), 0));
    const update = index.updateNotes(notes, provider());
    const inputLatency = await latency;
    await update;
    await writeFile("/tmp/davinci-ai-benchmark.json", JSON.stringify({ inputLatency, notes: names.length }));
    console.error(`real 350-file fixture input latency: ${inputLatency.toFixed(2)} ms`);
    expect(names).toHaveLength(350);
    expect(inputLatency).toBeLessThan(50);
  });
});
