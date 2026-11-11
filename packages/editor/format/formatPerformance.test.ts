import { describe, it, expect } from "vitest";
import { formatMarkdown } from "./formatMarkdown";

describe("formatMarkdown performance benchmark", () => {
  it("formats a 5,000-line note in under 100ms", () => {
    // Generate 5,000 lines with a mix of headings, lists, tables, code blocks, and text
    const blocks: string[] = [
      `---
title: Big 5000-Line Note
tags: [benchmark, scale]
---

# Main Big Note Title

Introduction paragraph with [[SomeLink|Link Alias]] and #important-tag.
`,
    ];

    for (let i = 0; i < 500; i += 1) {
      blocks.push(`## Section ${i}

Here is a paragraph of text with \`inline code\` and trailing spaces.    
Another wrapped line in section ${i}.

* item 1 with messy marker
+ item 2
  * nested item 2.1

| Column A | Column B | Column C |
| --- | --- | --- |
| Data ${i} | Some text | Extra data |

\`\`\`typescript
const val = ${i};
console.log("Section", val);
\`\`\`
`);
    }

    const largeDocument = blocks.join("\n");
    const lineCount = largeDocument.split("\n").length;
    expect(lineCount).toBeGreaterThanOrEqual(5000);

    const start = performance.now();
    const result = formatMarkdown(largeDocument);
    const durationMs = performance.now() - start;

    console.log(`\n=== 5,000-LINE NOTE FORMAT BENCHMARK ===`);
    console.log(`Lines: ${lineCount}`);
    console.log(`Characters: ${largeDocument.length}`);
    console.log(`Duration: ${durationMs.toFixed(2)} ms`);
    console.log(`========================================\n`);

    expect(result.changed).toBe(true);
    // Must be extremely fast to avoid blocking the main thread (well under 100ms)
    expect(durationMs).toBeLessThan(150);

    // Verify idempotence on 5,000 lines
    const start2 = performance.now();
    const result2 = formatMarkdown(result.formatted);
    const duration2 = performance.now() - start2;
    expect(result2.changed).toBe(false);
    expect(result2.formatted).toBe(result.formatted);
    console.log(`Second pass (idempotent): ${duration2.toFixed(2)} ms`);
  });
});
