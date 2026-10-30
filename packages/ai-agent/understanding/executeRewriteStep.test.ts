import { describe, it, expect, vi } from "vitest";
import { executeRewriteStep } from "./executeRewriteStep.js";
import { validateStructuredUserRequest } from "./rewriteSchema.js";
import { parseRewriteResponse } from "./rewritePrompt.js";

describe("executeRewriteStep", () => {
  it("parses valid JSON response on first attempt", async () => {
    const raw = "create a note for groceries";
    const mockModel = vi.fn().mockResolvedValue(
      JSON.stringify({
        goal: "Create a note for groceries",
        intent: "create_note",
        target: "groceries.md",
        constraints: [],
        ambiguities: [],
      }),
    );

    const result = await executeRewriteStep(raw, mockModel);
    expect(mockModel).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      goal: "Create a note for groceries",
      intent: "create_note",
      target: "groceries.md",
      constraints: [],
      ambiguities: [],
    });
  });

  it("extracts JSON wrapped in markdown code blocks", async () => {
    const raw = "find my notes on rust";
    const mockModel = vi.fn().mockResolvedValue(`Here is your structured request:
\`\`\`json
{
  "goal": "Find notes about rust",
  "intent": "search_vault",
  "target": "rust",
  "constraints": [],
  "ambiguities": []
}
\`\`\``);

    const result = await executeRewriteStep(raw, mockModel);
    expect(result.intent).toBe("search_vault");
    expect(result.target).toBe("rust");
  });

  it("retries once if first attempt is malformed JSON, and succeeds on retry", async () => {
    const raw = "summarize recent tasks";
    const mockModel = vi
      .fn()
      .mockResolvedValueOnce("Sure! I can help you with that.")
      .mockResolvedValueOnce(
        JSON.stringify({
          goal: "Summarize recent tasks",
          intent: "search_vault",
          target: "tasks",
          constraints: ["recent"],
          ambiguities: [],
        }),
      );

    const result = await executeRewriteStep(raw, mockModel);
    expect(mockModel).toHaveBeenCalledTimes(2);
    expect(result.goal).toBe("Summarize recent tasks");
    expect(result.constraints).toEqual(["recent"]);
  });

  it("falls back to raw message if both initial call and retry fail", async () => {
    const raw = "weird prompt that confuses LLM";
    const mockModel = vi
      .fn()
      .mockResolvedValueOnce("Invalid response 1")
      .mockResolvedValueOnce("Invalid response 2");

    const result = await executeRewriteStep(raw, mockModel);
    expect(mockModel).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      goal: "weird prompt that confuses LLM",
      intent: "chat",
      target: null,
      constraints: [],
      ambiguities: [],
    });
  });

  it("falls back safely if callModel throws an unexpected network error", async () => {
    const raw = "hello";
    const mockModel = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const result = await executeRewriteStep(raw, mockModel);
    expect(result.goal).toBe("hello");
    expect(result.intent).toBe("chat");
  });

  it("validates missing required fields and stringifies null targets", () => {
    const invalid1 = validateStructuredUserRequest({
      goal: "",
      intent: "read_note",
      target: null,
      constraints: [],
      ambiguities: [],
    });
    expect(invalid1.success).toBe(false);

    const validWithNullString = validateStructuredUserRequest({
      goal: "Read that note",
      intent: "read_note",
      target: "null",
      constraints: [],
      ambiguities: ["Which note is meant"],
    });
    expect(validWithNullString.success).toBe(true);
    if (validWithNullString.success) {
      expect(validWithNullString.data.target).toBeNull();
      expect(validWithNullString.data.ambiguities).toEqual([
        "Which note is meant",
      ]);
    }
  });

  it("handles non-English and typo requests cleanly", () => {
    const parse = parseRewriteResponse(`{
      "goal": "Créer une note pour la réunion",
      "intent": "create_note",
      "target": "reunion.md",
      "constraints": [],
      "ambiguities": []
    }`);
    expect(parse.success).toBe(true);
    if (parse.success) {
      expect(parse.data.goal).toBe("Créer une note pour la réunion");
    }
  });
});
