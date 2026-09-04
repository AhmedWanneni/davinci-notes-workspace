import { describe, expect, it, vi } from "vitest";
import { AIProviderError } from "@app/ai-api";
import { OpenAICompatibleTransport } from "./cloudTransport";

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("OpenAICompatibleTransport", () => {
  it("sends embeddings and parses vectors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(200, { model: "embed", data: [{ embedding: [1, 2] }] }));
    const transport = new OpenAICompatibleTransport({ apiKey: "test-key", baseUrl: "https://test", fetchImpl });
    await expect(transport.embed({ inputs: ["probe"] })).resolves.toEqual({ vectors: [[1, 2]], model: "embed" });
    expect(fetchImpl).toHaveBeenCalledWith("https://test/embeddings", expect.objectContaining({ method: "POST" }));
  });

  it("binds the default fetch to its global owner", async () => {
    const fetchImpl = vi.fn(function (this: unknown) {
      expect(this).toBe(globalThis);
      return Promise.resolve(response(200, { model: "embed", data: [{ embedding: [1] }] }));
    });
    vi.stubGlobal("fetch", fetchImpl);
    try {
      await expect(new OpenAICompatibleTransport({ apiKey: "x" }).embed({ inputs: ["x"] })).resolves.toEqual({
        vectors: [[1]],
        model: "embed",
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([[401, "authentication"], [429, "rate-limited"], [500, "unavailable"]] as const)("maps %s to %s", async (status, code) => {
    const fetchImpl = vi.fn().mockResolvedValue(response(status, { error: { message: "provider failure" } }));
    await expect(new OpenAICompatibleTransport({ apiKey: "x", fetchImpl }).embed({ inputs: ["x"] })).rejects.toMatchObject({ code });
  });

  it("maps network failures explicitly", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(new OpenAICompatibleTransport({ apiKey: "x", fetchImpl }).embed({ inputs: ["x"] })).rejects.toBeInstanceOf(AIProviderError);
  });
});
