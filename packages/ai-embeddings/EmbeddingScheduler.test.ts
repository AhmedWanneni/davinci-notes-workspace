import type { AIProvider } from "@app/ai-api";
import { describe, expect, it, vi } from "vitest";
import { EmbeddingIndex } from "./EmbeddingIndex";
import { EmbeddingScheduler } from "./EmbeddingScheduler";

const fakeProvider = (): AIProvider => ({
  id: "fixture",
  mode: "cloud",
  capabilities: new Set(["embeddings"]),
  embed: vi.fn(async ({ inputs }) => ({ vectors: inputs.map(() => [1]), model: "fixture" })),
  complete: vi.fn(),
  dispose: vi.fn(async () => {}),
});

describe("EmbeddingScheduler", () => {
  it("coalesces a burst at the vault watcher settle boundary", async () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn(async () => {});
    const scheduler = new EmbeddingScheduler({
      provider: fakeProvider(),
      index: new EmbeddingIndex(async (value) => value),
      settleMs: 450,
      onUpdate,
    });
    scheduler.enqueue([
      { path: "a.md", title: "a", content: "a", frontmatter: {}, outlinks: [], tags: { frontmatter: [], inline: [], all: [] }, mtime: 1 },
    ]);
    await vi.advanceTimersByTimeAsync(449);
    expect(onUpdate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await Promise.resolve();
    await Promise.resolve();
    expect(onUpdate).toHaveBeenCalledOnce();
    scheduler.dispose();
    vi.useRealTimers();
  });
});
