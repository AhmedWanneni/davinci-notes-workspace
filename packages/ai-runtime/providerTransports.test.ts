import { describe, expect, it, vi } from "vitest";
import { GeminiTransport } from "./geminiTransport";
import { OllamaTransport } from "./ollamaTransport";
import { createOpenRouterProvider } from "./providerImplementations";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("provider transports", () => {
  it("sends Gemini embedding and chat requests", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ embedding: { values: [1, 2] } }))
      .mockResolvedValueOnce(response({ candidates: [{ content: { parts: [{ text: "hello" }] } }] }));
    const transport = new GeminiTransport({ apiKey: "key", fetchImpl });
    expect(await transport.embed({ inputs: ["note"] })).toEqual({ vectors: [[1, 2]], model: "gemini-embedding-001" });
    expect((await transport.complete({ messages: [{ role: "user", content: "hi" }] })).content).toBe("hello");
    expect(fetchImpl.mock.calls[0][0]).toContain("gemini-embedding-001:embedContent");
    expect(fetchImpl.mock.calls[1][1].headers["x-goog-api-key"]).toBe("key");
  });

  it("maps invalid Gemini credentials to authentication", async () => {
    const transport = new GeminiTransport({ apiKey: "bad", fetchImpl: vi.fn().mockResolvedValue(response({ error: { message: "bad key" } }, 401)) });
    await expect(transport.embed({ inputs: ["probe"] })).rejects.toMatchObject({ code: "authentication" });
  });

  it("uses OpenRouter's OpenAI-compatible transport", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ data: [{ embedding: [3, 4] }], model: "m" }));
    const provider = await createOpenRouterProvider({ apiKey: "key", embeddingModel: "provider/embed", chatModel: "provider/chat", fetchImpl });
    expect(await provider.embed({ inputs: ["note"] })).toEqual({ vectors: [[3, 4]], model: "m" });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/embeddings");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).model).toBe("provider/embed");
  });

  it("uses Ollama locally and reports a stopped server distinctly", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ model: "embeddinggemma", embeddings: [[5, 6]] }));
    const transport = new OllamaTransport({ fetchImpl });
    expect(await transport.embed({ inputs: ["note"] })).toEqual({ vectors: [[5, 6]], model: "embeddinggemma" });
    expect(fetchImpl.mock.calls[0][0]).toBe("http://localhost:11434/api/embed");
    const stopped = new OllamaTransport({ fetchImpl: vi.fn().mockRejectedValue(new Error("connection refused")) });
    await expect(stopped.embed({ inputs: ["probe"] })).rejects.toMatchObject({ code: "local-server-unavailable" });
  });
});
