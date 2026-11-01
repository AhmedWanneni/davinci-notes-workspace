import { describe, expect, it } from "vitest";
import { deriveConversationContextTitle } from "./agentContextTitle";

describe("deriveConversationContextTitle", () => {
  it("derives clean titles by stripping mentions and slash commands", () => {
    const title = deriveConversationContextTitle(
      "@Docs/Design.md /model summarize the architecture",
    );
    expect(title).toBe("Summarize the architecture");
  });

  it("cleans markdown headers and conversational prefixes", () => {
    const title = deriveConversationContextTitle(
      "### Please investigate AI UI box overuse in production",
    );
    expect(title).toBe("Investigate AI UI box overuse in...");
  });

  it("handles short queries directly", () => {
    const title = deriveConversationContextTitle("Audio transcription tools");
    expect(title).toBe("Audio transcription tools");
  });

  it("falls back to New Chat on blank or symbols only", () => {
    expect(deriveConversationContextTitle("")).toBe("New Chat");
    expect(deriveConversationContextTitle("   ")).toBe("New Chat");
    expect(deriveConversationContextTitle("@file")).toBe("New Chat");
  });
});
