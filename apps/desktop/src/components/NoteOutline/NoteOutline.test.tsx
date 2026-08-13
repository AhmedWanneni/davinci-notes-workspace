import { describe, it, expect } from "vitest";
import { extractHeadings } from "./NoteOutline";

describe("extractHeadings", () => {
  it("extracts H1, H2, H3 headings correctly", () => {
    const markdown = `
# Title

Some introductory text.

## Section One
Content in section one.

### Subsection A
More detail.

## Section Two
Closing text.
`;
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(4);
    expect(headings[0]).toEqual({
      id: "heading-1-title",
      level: 1,
      text: "Title",
      line: 2,
    });
    expect(headings[1]).toEqual({
      id: "heading-5-section-one",
      level: 2,
      text: "Section One",
      line: 6,
    });
    expect(headings[2]).toEqual({
      id: "heading-8-subsection-a",
      level: 3,
      text: "Subsection A",
      line: 9,
    });
    expect(headings[3]).toEqual({
      id: "heading-11-section-two",
      level: 2,
      text: "Section Two",
      line: 12,
    });
  });

  it("ignores headings inside fenced code blocks", () => {
    const markdown = `
# Real Heading

\`\`\`markdown
# Fake Heading Inside Code
## Another Fake
\`\`\`

## Another Real Heading
`;
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(2);
    expect(headings[0].text).toBe("Real Heading");
    expect(headings[1].text).toBe("Another Real Heading");
  });

  it("strips wikilinks and formatting characters from heading text", () => {
    const markdown = `## **Bold** and [[Wikilink Note]] in *Heading*`;
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe("Bold and Wikilink Note in Heading");
  });

  it("returns empty array for content without headings", () => {
    expect(extractHeadings("Just plain text without headings.")).toEqual([]);
    expect(extractHeadings("")).toEqual([]);
  });
});
