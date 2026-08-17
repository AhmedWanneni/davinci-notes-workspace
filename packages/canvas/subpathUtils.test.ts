import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  extractSectionByHeading,
  normalizeHeadingTarget,
} from "./subpathUtils";

describe("subpathUtils", () => {
  const sampleMarkdown = `
# Main Title

Intro paragraph.

## Architecture

This is architecture.

### Storage

SQLite details.

### Networking

Sync details.

## Deployment

Deploy steps here.

# Conclusion

Final thoughts.
`.trim();

  it("normalizes heading target strings correctly", () => {
    expect(normalizeHeadingTarget("# Architecture")).toBe("architecture");
    expect(normalizeHeadingTarget("## **Architecture**")).toBe("architecture");
    expect(normalizeHeadingTarget("# [[Architecture]]")).toBe("architecture");
  });

  it("extracts headings while ignoring code blocks", () => {
    const markdownWithCode = `
# Title
\`\`\`markdown
# Not A Real Heading
\`\`\`
## Section
`;
    const headings = extractHeadings(markdownWithCode);
    expect(headings).toHaveLength(2);
    expect(headings[0].text).toBe("Title");
    expect(headings[1].text).toBe("Section");
  });

  it("extracts section by heading up to next same or higher level heading", () => {
    const archSection = extractSectionByHeading(sampleMarkdown, "# Architecture");
    expect(archSection).toContain("## Architecture");
    expect(archSection).toContain("### Storage");
    expect(archSection).toContain("### Networking");
    expect(archSection).not.toContain("## Deployment");
    expect(archSection).not.toContain("# Conclusion");
  });

  it("extracts subsection correctly", () => {
    const storageSection = extractSectionByHeading(sampleMarkdown, "### Storage");
    expect(storageSection).toContain("### Storage");
    expect(storageSection).toContain("SQLite details.");
    expect(storageSection).not.toContain("### Networking");
  });

  it("returns full markdown when subpath is not found or empty", () => {
    expect(extractSectionByHeading(sampleMarkdown, "")).toBe(sampleMarkdown);
    expect(extractSectionByHeading(sampleMarkdown, "# NonExistent")).toBe(
      sampleMarkdown,
    );
  });
});
