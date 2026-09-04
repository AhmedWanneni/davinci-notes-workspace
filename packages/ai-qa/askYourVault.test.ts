import type { AIProvider } from "@app/ai-api";
import type { SqliteLike } from "@app/ai-embeddings";
import { describe, expect, it, vi } from "vitest";
import { askYourVault } from "./askYourVault";

const db = { select: vi.fn(async () => [{ chunk_id: "a", note_path: "a.md", heading: "Facts", start_line: 2, end_line: 3, content_hash: "h", model: "m", vector: [1, 0], text: "The answer is forty-two." }]), execute: vi.fn(async () => undefined) } as unknown as SqliteLike;
const provider = { id: "cloud", mode: "cloud" as const, capabilities: new Set(["embeddings", "chat"]), embed: vi.fn(async () => ({ vectors: [[1, 0]], model: "m" })), complete: vi.fn(async () => ({ content: "Forty-two.", model: "chat" })), dispose: vi.fn() } satisfies AIProvider;

describe("askYourVault", () => {
  it("gates before embedding and sends retrieved text plus question", async () => {
    const result = await askYourVault("What is the answer?", provider, db, { isConsented: async () => true });
    expect(result.citations[0]).toMatchObject({ chunkId: "a", notePath: "a.md", startLine: 2 });
    expect(provider.complete).toHaveBeenCalledWith({ messages: [{ role: "user", content: expect.stringContaining("The answer is forty-two.") }] });
  });

  it("does not call the provider when ask-vault consent is declined", async () => {
    provider.embed.mockClear();
    await expect(askYourVault("Question", provider, db, { isConsented: async () => false })).rejects.toThrow("consent");
    expect(provider.embed).not.toHaveBeenCalled();
  });
});
