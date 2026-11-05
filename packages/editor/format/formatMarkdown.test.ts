import { describe, it, expect } from "vitest";
import { formatMarkdown } from "./formatMarkdown";

describe("formatMarkdown", () => {
  it("trims trailing whitespace on lines", () => {
    const input = "Hello world    \nSecond line\t\t\nThird line";
    const res = formatMarkdown(input);
    expect(res.formatted).toBe("Hello world\nSecond line\nThird line\n");
    expect(res.changed).toBe(true);
  });

  it("collapses 3+ blank lines into 1 blank line", () => {
    const input = "Paragraph 1\n\n\n\n\nParagraph 2";
    const res = formatMarkdown(input);
    expect(res.formatted).toBe("Paragraph 1\n\nParagraph 2\n");
  });

  it("ensures a blank line around headings, lists, code blocks, and tables", () => {
    const input = `Intro paragraph
# Heading 1
Content under heading
* item 1
* item 2
Paragraph after list
| a | b |
|---|---|
| 1 | 2 |
Paragraph after table`;

    const res = formatMarkdown(input);
    expect(res.formatted).toContain(
      "Intro paragraph\n\n# Heading 1\n\nContent under heading",
    );
    expect(res.formatted).toContain(
      "Content under heading\n\n- item 1\n- item 2\n\nParagraph after list",
    );
    expect(res.formatted).toContain(
      "Paragraph after list\n\n| a   | b   |\n| --- | --- |\n| 1   | 2   |\n\nParagraph after table",
    );
  });

  it("makes list markers and indentation consistent", () => {
    const input = `* Item A
+ Item B
  * Nested 1
    + Nested 2
* [ ] Task 1
* [X] Task 2`;

    const res = formatMarkdown(input);
    expect(res.formatted).toBe(
      `- Item A\n- Item B\n  - Nested 1\n    - Nested 2\n- [ ] Task 1\n- [x] Task 2\n`,
    );
  });

  it("aligns table columns with padding", () => {
    const input = `| Title | Description | Status |
| --- | --- | --- |
| Short | A very long text description | Done |
| Medium text | Small | Todo |`;

    const res = formatMarkdown(input);
    const lines = res.formatted.trim().split("\n");
    expect(lines[0]).toBe(
      "| Title       | Description                  | Status |",
    );
    expect(lines[1]).toBe(
      "| ----------- | ---------------------------- | ------ |",
    );
    expect(lines[2]).toBe(
      "| Short       | A very long text description | Done   |",
    );
    expect(lines[3]).toBe(
      "| Medium text | Small                        | Todo   |",
    );
  });

  it("preserves line wrapping inside paragraphs", () => {
    const input = `This is a paragraph that was manually\nwrapped by the user on purpose.\nIt should not be reflowed into a single line.`;
    const res = formatMarkdown(input);
    expect(res.formatted).toBe(
      `This is a paragraph that was manually\nwrapped by the user on purpose.\nIt should not be reflowed into a single line.\n`,
    );
  });

  it("protects all specified regions byte-for-byte", () => {
    const fixture = `---
title: My Protected Note
tags: [alpha, beta]
custom: { nested: true }
---

# Title Heading Should Never Change

Some regular text with [[Note Title|Custom Alias With | Pipe]] and #my-tag and \`const x = a | b;\`.
Check embed ![[Attachment.png]] and callout:

> [!note] Callout Header
> Callout body content with %%comment to ignore%% and text.

\`\`\`typescript
// Fenced code with weird spacing and pipes
function test(a | b) {
    const weird = "spaces   ";
}
\`\`\`

Ending paragraph.
`;

    const res1 = formatMarkdown(fixture);
    // Verify protected regions are byte-identical
    expect(res1.formatted).toContain(`---
title: My Protected Note
tags: [alpha, beta]
custom: { nested: true }
---`);
    expect(res1.formatted).toContain("# Title Heading Should Never Change");
    expect(res1.formatted).toContain("[[Note Title|Custom Alias With | Pipe]]");
    expect(res1.formatted).toContain("`const x = a | b;`");
    expect(res1.formatted).toContain("#my-tag");
    expect(res1.formatted).toContain("![[Attachment.png]]");
    expect(res1.formatted).toContain("> [!note] Callout Header");
    expect(res1.formatted).toContain("%%comment to ignore%%");
    expect(res1.formatted).toContain(`\`\`\`typescript
// Fenced code with weird spacing and pipes
function test(a | b) {
    const weird = "spaces   ";
}
\`\`\``);

    // Idempotence test
    const res2 = formatMarkdown(res1.formatted);
    expect(res2.formatted).toBe(res1.formatted);
    expect(res2.changed).toBe(false);
  });

  it("is idempotent on any formatted text", () => {
    const messy = `
# Sample

Some text here    
with messy lines.



- item 1
* item 2
  + nested item

| a | b |
|---|---|
| 12345 | 6 |
| 7 | 891011 |

Fin.
`;
    const pass1 = formatMarkdown(messy);
    const pass2 = formatMarkdown(pass1.formatted);
    expect(pass2.formatted).toBe(pass1.formatted);
    expect(pass2.changed).toBe(false);
  });
});
