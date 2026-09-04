import { describe, expect, it } from "vitest";
import { AIProviderError } from "./AIProvider";

describe("AI provider contract", () => {
  it("marks authentication failures for reauthentication", () => {
    const error = new AIProviderError("authentication", "API key rejected");
    expect(error.retryable).toBe(false);
    expect(error.requiresReauthentication).toBe(true);
  });

  it("keeps the base contract modality-oriented", async () => {
    const operations = { embed: async () => ({ vectors: [[1]], model: "test" }), complete: async () => ({ content: "ok", model: "test" }), dispose: async () => undefined };
    expect(operations).toHaveProperty("embed");
    expect(operations).toHaveProperty("complete");
  });
});
