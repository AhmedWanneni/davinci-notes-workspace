import { describe, it, expect } from "vitest";
import { parseLinks, parseFrontmatter } from "./index";

describe("Part 4: Indexer and Backlink Verification for Database Tables", () => {
  it("treats database table notes normally and parses wikilinks in cells as backlinks", () => {
    const dbNoteContent = `---
database: table
columns:
  - name: Project
    type: text
  - name: Owner
    type: text
  - name: Status
    type: select
    options:
      - { value: Active, color: green }
      - { value: Blocked, color: red }
  - name: Reviewed
    type: checkbox
---

# Team Database

| Project | Owner | Status | Reviewed |
|---|---|---|---|
| [[Design System Architecture]] | [[Alice Smith]] | Active | true |
| [[Q4 Roadmap#Milestones|Roadmap Plan]] | [[Bob Jones]] | Blocked | false |
`;

    // 1. Frontmatter parsing
    const { frontmatter, content } = parseFrontmatter(dbNoteContent);
    expect(frontmatter.database).toBe("table");
    expect(Array.isArray(frontmatter.columns)).toBe(true);
    expect(frontmatter.columns).toHaveLength(4);

    // 2. Wikilink extraction from cells
    const allKnownPaths = [
      "Design System Architecture.md",
      "Alice Smith.md",
      "Q4 Roadmap.md",
      "Bob Jones.md",
    ];

    const links = parseLinks(content, {
      sourcePath: "Data/Projects Table.md",
      notePaths: allKnownPaths,
    });

    const wikilinks = links.filter((link) => link.type === "wikilink");
    expect(wikilinks).toHaveLength(4);

    const targets = wikilinks.map((link) => link.target);
    expect(targets).toContain("Design System Architecture.md");
    expect(targets).toContain("Alice Smith.md");
    expect(targets).toContain("Q4 Roadmap.md");
    expect(targets).toContain("Bob Jones.md");

    // Check alias preservation from cell
    const aliasedLink = wikilinks.find(
      (link) => link.target === "Q4 Roadmap.md",
    );
    expect(aliasedLink?.displayText).toBe("Roadmap Plan");
    expect(aliasedLink?.heading).toBe("Milestones");
  });
});
