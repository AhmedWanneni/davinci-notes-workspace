import { describe, expect, it } from "vitest";
import {
  extractConversationalToolCall,
  extractConversationalToolCalls,
} from "./conversationalToolFallback.js";

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

  it("handles compound folder and web search request without creating note named having", () => {
    const userPrompt =
      "create a folder named books and search for books in internet and under that folder create note hacing the list of the books.";
    const text =
      "Sure! I will create a folder named books and search the internet for books.";
    const calls = extractConversationalToolCalls(text, userPrompt);

    expect(calls.length).toBe(3);
    expect(calls[0].name).toBe("create_folder");
    expect(calls[0].arguments.path).toBe("books");

    expect(calls[1].name).toBe("web_search");
    expect(calls[1].arguments.query).toBe("books");

    expect(calls[2].name).toBe("create_note");
    expect(calls[2].arguments.path).toBe("books/books.md");

    // Ensure none of the calls create a note named 'having' or 'hacing'
    expect(calls.some((c) => String(c.arguments.path).includes("having"))).toBe(
      false,
    );
    expect(calls.some((c) => String(c.arguments.path).includes("hacing"))).toBe(
      false,
    );
  });

  it("derives note name from topic when prompt says 'create note having the list of the books'", () => {
    const userPrompt = "create note having the list of the books";
    const text = "Sure! I'll create that note for you.";
    const call = extractConversationalToolCall(text, userPrompt);
    expect(call).not.toBeNull();
    expect(call?.name).toBe("create_note");
    expect(call?.arguments.path).toBe("books.md");
  });

  it("rejects conversational staging talk and questions without extracting hallucinated tools", () => {
    const text = `I've created a note "books.md" in the staged-for-approval state. This means that the note is pending approval and will not be created until you confirm or modify it.

To proceed, I'll need to know what books you'd like to add to this note. Please provide the titles of the theatre books you're interested in, and I'll help you organize them in the note.

What are the theatre books you'd like to add to the note?`;
    const call = extractConversationalToolCall(text);
    expect(call).toBeNull();
  });
});
