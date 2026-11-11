import { describe, expect, it } from "vitest";
import { extractEditToolCall } from "./conversationalEditFallback.js";
import { extractConversationalToolCalls } from "./conversationalToolFallback.js";

describe("conversationalEditFallback", () => {
  const dummyExtractCodeBlock = (text: string) => {
    const match = /```(?:markdown|md)?\s*\n([\s\S]*?)\n```/.exec(text);
    return match ? match[1].trim() : "";
  };

  it("extracts edit_note from user prompt: update file ideas.md", () => {
    const prompt = "update file ideas.md with new thoughts";
    const text = "Sure, I have updated the ideas note.";
    const call = extractEditToolCall(prompt, text, dummyExtractCodeBlock);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("edit_note");
    expect(call?.arguments.path).toBe("ideas.md");
  });

  it("extracts edit_note from in-note prompt: in notes/todo.md add buy milk", () => {
    const prompt = "in notes/todo.md add buy milk";
    const text = "Done!";
    const call = extractEditToolCall(prompt, text, dummyExtractCodeBlock);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("edit_note");
    expect(call?.arguments.path).toBe("notes/todo.md");
  });

  it("extracts edit_note from assistant output: I have updated the file Story/Nadine.md", () => {
    const prompt = "Please improve the draft.";
    const text = "I have updated the file Story/Nadine.md with more descriptive prose.";
    const call = extractEditToolCall(prompt, text, dummyExtractCodeBlock);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("edit_note");
    expect(call?.arguments.path).toBe("Story/Nadine.md");
  });

  it("extracts edit_note from passive assistant output: Updated note Meeting.md", () => {
    const prompt = "Check the minutes.";
    const text = "Updated note Meeting.md with attendee list.";
    const call = extractEditToolCall(prompt, text, dummyExtractCodeBlock);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("edit_note");
    expect(call?.arguments.path).toBe("Meeting.md");
  });

  it("extracts codeblock content when provided in assistant output", () => {
    const prompt = "update note Roadmap.md";
    const text = "Updated note Roadmap.md:\n\n```markdown\n# Roadmap 2026\n- Feature X\n```";
    const call = extractEditToolCall(prompt, text, dummyExtractCodeBlock);
    expect(call).not.toBeNull();
    expect(call?.arguments.path).toBe("Roadmap.md");
    expect(call?.arguments.content).toBe("# Roadmap 2026\n- Feature X");
  });

  it("integrates with extractConversationalToolCalls to prioritize edit over create", () => {
    const prompt = "update file Changelog.md";
    const text = "I have updated the file Changelog.md.";
    const calls = extractConversationalToolCalls(text, prompt);
    expect(calls.length).toBe(1);
    expect(calls[0].name).toBe("edit_note");
    expect(calls[0].arguments.path).toBe("Changelog.md");
  });
});
