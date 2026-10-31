import { describe, it, expect } from "vitest";
import { parseMarkdownBlocks } from "./agentMarkdownParser";

describe("agentMarkdownParser", () => {
  it("extracts reasoning block from <think>...</think> tags", () => {
    const raw = "<think>Analyzing graph index and reading notes...</think>\nHere is the answer.";
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: "reasoning",
      content: "Analyzing graph index and reading notes...",
      isStreaming: false,
    });
    expect(blocks[1]).toEqual({
      type: "paragraph",
      text: "Here is the answer.",
    });
  });

  it("handles unclosed <think> during active streaming", () => {
    const raw = "<think>Still thinking about";
    const blocks = parseMarkdownBlocks(raw, true);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "reasoning",
      content: "Still thinking about",
      isStreaming: true,
    });
  });

  it("extracts fenced code blocks with language", () => {
    const raw = "```typescript\nconst a: number = 42;\nconsole.log(a);\n```";
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "code",
      code: "const a: number = 42;\nconsole.log(a);",
      language: "typescript",
      isStreaming: false,
    });
  });

  it("handles unclosed code blocks during stream", () => {
    const raw = "```python\ndef hello():\n    print('world')";
    const blocks = parseMarkdownBlocks(raw, true);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "code",
      code: "def hello():\n    print('world')",
      language: "python",
      isStreaming: true,
    });
  });

  it("extracts markdown tables", () => {
    const raw = "| Name | Role |\n|---|---|\n| Alice | Lead |\n| Bob | Dev |";
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "table",
      headers: ["Name", "Role"],
      rows: [
        ["Alice", "Lead"],
        ["Bob", "Dev"],
      ],
    });
  });

  it("extracts blockquotes and lists", () => {
    const raw = "> Important note here\n\n- Bullet 1\n- Bullet 2\n\n1. Numbered 1\n2. Numbered 2";
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({
      type: "blockquote",
      text: "Important note here",
    });
    expect(blocks[1]).toEqual({
      type: "list",
      ordered: false,
      items: ["Bullet 1", "Bullet 2"],
    });
    expect(blocks[2]).toEqual({
      type: "list",
      ordered: true,
      items: ["Numbered 1", "Numbered 2"],
    });
  });

  it("extracts grounded citations", () => {
    const raw = "Grounded search results:\n[1] https://wikipedia.org/wiki/Obsidian\n[2] https://google.com/search";
    const blocks = parseMarkdownBlocks(raw);

    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toEqual({
      type: "citations",
      links: [{ index: 1, url: "https://wikipedia.org/wiki/Obsidian", domain: "wikipedia.org" }],
    });
  });
});
