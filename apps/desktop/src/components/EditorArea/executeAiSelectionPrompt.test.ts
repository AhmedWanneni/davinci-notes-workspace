import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildAiSelectionSystemPrompt,
  buildAiSelectionUserPrompt,
  executeAiSelectionPrompt,
} from "./executeAiSelectionPrompt";

const { mockComplete, mockDispose } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockDispose: vi.fn(),
}));

vi.mock("../../ai/loadAISubsystem", () => ({
  loadAISubsystem: vi.fn().mockResolvedValue({
    loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
    createConfiguredProvider: vi.fn().mockResolvedValue({
      complete: mockComplete,
      dispose: mockDispose,
    }),
  }),
}));

describe("executeAiSelectionPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds an explanatory system prompt for explain action", () => {
    const prompt = buildAiSelectionSystemPrompt("explain");
    expect(prompt).toContain("Explain the selected text clearly");
  });

  it("builds a direct replacement system prompt for edit/rewrite actions", () => {
    const prompt = buildAiSelectionSystemPrompt("rewrite");
    expect(prompt).toContain("Return ONLY the revised/generated replacement");
    expect(prompt).toContain("Do NOT include conversational chatter");
  });

  it("formats user prompt with selection, instruction, and note context", () => {
    const userPrompt = buildAiSelectionUserPrompt(
      "Hello world",
      "Make it formal",
      "Meeting Notes",
    );
    expect(userPrompt).toContain('Context (Note: "Meeting Notes")');
    expect(userPrompt).toContain("Hello world");
    expect(userPrompt).toContain("Make it formal");
  });

  it("executes prompt with configured provider and returns trimmed content", async () => {
    mockComplete.mockResolvedValueOnce({
      content: "Greetings, world.",
    });

    const res = await executeAiSelectionPrompt({
      selectedText: "Hello world",
      instruction: "Make it formal",
      action: "rewrite",
      noteTitle: "Doc",
    });

    expect(res).toBe("Greetings, world.");
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it("throws when selection is empty", async () => {
    await expect(
      executeAiSelectionPrompt({
        selectedText: "   ",
        instruction: "Rewrite",
        action: "rewrite",
      }),
    ).rejects.toThrow("No text selected to edit.");
  });
});
