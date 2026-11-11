import { describe, expect, it } from "vitest";
import {
  serializeLibraryItemToMarkdown,
  parseMarkdownToLibraryItem,
  getLibraryItemFilePath,
} from "./libraryMarkdown.js";
import type { LibraryItem, AgentProject } from "./conversationTypes.js";

describe("libraryMarkdown", () => {
  const sampleItem: LibraryItem = {
    id: "lib-summary",
    title: "Meeting Summary & Action Items",
    type: "skill",
    description: "Extract meeting tasks and owners",
    content: "Extract bullet points and tables from transcript.",
    tags: ["Productivity", "Meetings"],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
  };

  it("serializes library item to clean markdown with frontmatter", () => {
    const md = serializeLibraryItemToMarkdown(sampleItem, "General");
    expect(md).toContain('title: "Meeting Summary & Action Items"');
    expect(md).toContain('type: "skill"');
    expect(md).toContain('tags: ["Productivity", "Meetings"]');
    expect(md).toContain("Extract bullet points and tables from transcript.");
  });

  it("parses markdown with frontmatter back into LibraryItem", () => {
    const md = `---
title: "Data Triage Script"
type: "skill"
description: "Organize files"
tags: ["Vault", "Cleanup"]
id: "lib-triage"
---
\`\`\`python
print("Triage script")
\`\`\`
`;
    const item = parseMarkdownToLibraryItem(
      md,
      "ai-library/skills/Data Triage Script.md",
    );
    expect(item.id).toBe("lib-triage");
    expect(item.title).toBe("Data Triage Script");
    expect(item.type).toBe("skill");
    expect(item.tags).toEqual(["Vault", "Cleanup"]);
    expect(item.content).toContain('print("Triage script")');
    expect(item.filePath).toBe("ai-library/skills/Data Triage Script.md");
  });

  it("infers type from folder name when frontmatter type is missing", () => {
    const md = `# My Rule\nAlways write in bullet points.`;
    const item = parseMarkdownToLibraryItem(md, "ai-library/rules/My Rule.md");
    expect(item.type).toBe("rule");
    expect(item.title).toBe("My Rule");
    expect(item.content).toBe("# My Rule\nAlways write in bullet points.");
  });

  it("associates project from path or frontmatter", () => {
    const projects: AgentProject[] = [
      { id: "proj_fitness", name: "Fitness", createdAt: 1000 },
    ];
    const md = `---
title: Workout Plan
---
4 day upper lower`;
    const item = parseMarkdownToLibraryItem(
      md,
      "ai-library/Fitness/prompts/Workout Plan.md",
      projects,
    );
    expect(item.projectId).toBe("proj_fitness");
    expect(item.type).toBe("prompt");
  });

  it("computes correct subfolder vault paths", () => {
    const globalPath = getLibraryItemFilePath(sampleItem);
    expect(globalPath).toBe(
      "ai-library/skills/Meeting Summary & Action Items.md",
    );

    const projectPath = getLibraryItemFilePath(sampleItem, "Fitness");
    expect(projectPath).toBe(
      "ai-library/Fitness/skills/Meeting Summary & Action Items.md",
    );
  });
});
