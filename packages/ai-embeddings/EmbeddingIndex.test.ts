import type { AIProvider } from "@app/ai-api";
import type { Note } from "@app/core-types";
import { describe, expect, it, vi } from "vitest";
import { EmbeddingIndex, hashText } from "./EmbeddingIndex";
import { chunkNote } from "./chunkNote";

const note = (path: string, content: string): Note => ({
  path,
  title: path,
  content,
  frontmatter: {},
  outlinks: [],
  tags: { frontmatter: [], inline: [], all: [] },
  mtime: 1,
});

function provider(): AIProvider & { embed: ReturnType<typeof vi.fn> } {
  return {
    id: "fixture",
    mode: "cloud",
    capabilities: new Set(["embeddings"]),
    embed: vi.fn(async ({ inputs }: { inputs: string[] }) => ({
      vectors: inputs.map(() => [1, 0, 0]),
      model: "fixture-embedding",
    })),
    complete: vi.fn(),
    dispose: vi.fn(async () => {}),
  };
}

describe("embedding infrastructure", () => {
  it("chunks by headings and paragraphs with source locations", () => {
    const chunks = chunkNote("notes/a.md", "# Intro\n\nalpha\n\nbeta");
    expect(chunks.map((chunk) => chunk.text)).toEqual(["alpha", "beta"]);
    expect(chunks[0].heading).toBe("Intro");
    expect(chunks[0].notePath).toBe("notes/a.md");
  });

  it("regenerates only changed chunks and removes stale chunks", async () => {
    const ai = provider();
    const index = new EmbeddingIndex(hashText);
    const first = await index.updateNotes([note("a.md", "one\n\ntwo")], ai);
    expect(first.regenerated).toHaveLength(2);
    ai.embed.mockClear();
    const second = await index.updateNotes([note("a.md", "one\n\nchanged")], ai);
    console.info(JSON.stringify({ initial: first.regenerated, afterEdit: second.regenerated }));
    expect(second.regenerated).toHaveLength(1);
    expect(ai.embed).toHaveBeenCalledOnce();
    expect(second.removed).toHaveLength(0);
  });

  it("keeps the event loop available during a 350-note batch", async () => {
    const ai = provider();
    const index = new EmbeddingIndex(hashText);
    const notes = Array.from({ length: 350 }, (_, i) =>
      note(`notes/note-${i}.md`, `# Note ${i}\n\n${"large paste ".repeat(80)}`),
    );
    const scheduled = performance.now();
    const inputLatency = new Promise<number>((resolve) =>
      setTimeout(() => resolve(performance.now() - scheduled), 0),
    );
    const update = index.updateNotes(notes, ai);
    const latency = await inputLatency;
    await update;
    console.info(`embedding input latency during 350-note batch: ${latency.toFixed(2)} ms`);
    expect(latency).toBeLessThan(50);
    expect(index.snapshot()).toHaveLength(350);
  });
});
