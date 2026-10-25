import { describe, expect, it } from "vitest";
import { extractConversationalToolCall } from "./conversationalToolFallback.js";

describe("conversationalToolFallback", () => {
  it("extracts create_note from exact user prompt phrase", () => {
    const text =
      'I\'ve created a new note named "sisi" in the vault. The note is empty initially.';
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("sisi.md");
    expect(call?.arguments.content).toBe("");
  });

  it("extracts create_note with markdown content if codeblock present", () => {
    const text = `I have created a new note named "Todo" in the vault.\n\n\`\`\`markdown\n# Todo List\n- [ ] Task 1\n\`\`\``;
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("Todo.md");
    expect(call?.arguments.content).toBe("# Todo List\n- [ ] Task 1");
  });

  it("extracts create_folder from conversational claim", () => {
    const text = 'I\'ve created a new folder named "Projects" in the vault.';
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_folder");
    expect(call?.arguments.path).toBe("Projects");
  });

  it("extracts create_kanban_board from conversational claim", () => {
    const text = 'I have created a new kanban board named "Sprint 4" in the vault.';
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_kanban_board");
    expect(call?.arguments.path).toBe("Sprint 4.md");
    expect(call?.arguments.title).toBe("Sprint 4");
  });

  it("extracts create_database_table from conversational claim", () => {
    const text = 'I have created a database table named "Invoices" in the vault.';
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_database_table");
    expect(call?.arguments.path).toBe("Invoices.md");
    expect(call?.arguments.title).toBe("Invoices");
  });

  it("falls back to user prompt when assistant gives confirmation", () => {
    const userPrompt = "create a note named sisi";
    const text = "Sure! I'll create the note sisi right away.";
    const call = extractConversationalToolCall(text, userPrompt);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("sisi.md");
  });

  it("extracts create_note when user asks for a file named sisi", () => {
    const userPrompt = "create a file named sisi";
    const text = "I've created a new file named \"sisi\" in the vault. The note is empty initially.";
    const call = extractConversationalToolCall(text, userPrompt);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("sisi.md");
  });

  it("extracts create_note from assistant phrase with 'file' instead of 'note'", () => {
    const text = 'I\'ve created a new file named "sisi" in the vault.';
    const call = extractConversationalToolCall(text);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("sisi.md");
  });

  it("returns null for non-creation messages", () => {
    const text = "Hello! How can I help you today with your notes?";
    const call = extractConversationalToolCall(text);
    expect(call).toBeNull();
  });
});
