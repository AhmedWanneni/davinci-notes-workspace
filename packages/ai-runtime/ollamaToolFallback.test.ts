import { describe, expect, it } from "vitest";
import {
  extractOllamaFallbackToolCall,
  formatOllamaToolSystemPrompt,
} from "./ollamaToolFallback.js";

describe("ollamaToolFallback", () => {
  it("formats tool instructions into system prompt", () => {
    const prompt = formatOllamaToolSystemPrompt(
      "You are a helpful assistant.",
      [
        {
          name: "read_note",
          description: "Read a note",
          parameters: {
            type: "object",
            properties: { path: { type: "string" } },
          },
        },
      ],
    );
    expect(prompt).toContain("read_note");
    expect(prompt).toContain("You have access to the following tools:");
  });

  it("extracts tool call from fenced markdown json", () => {
    const output =
      '```json\n{\n  "tool": "read_note",\n  "arguments": {"path": "Notes/test.md"}\n}\n```';
    const call = extractOllamaFallbackToolCall(output);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("read_note");
    expect(call?.arguments).toEqual({ path: "Notes/test.md" });
  });

  it("extracts tool call from raw json", () => {
    const output = '{"name": "search_vault", "arguments": {"query": "ideas"}}';
    const call = extractOllamaFallbackToolCall(output);
    expect(call?.name).toBe("search_vault");
    expect(call?.arguments).toEqual({ query: "ideas" });
  });

  it("returns null on conversational text", () => {
    const output = "Here is what I found in your notes about architecture.";
    expect(extractOllamaFallbackToolCall(output)).toBeNull();
  });
});
