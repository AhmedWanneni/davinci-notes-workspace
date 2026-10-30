import { describe, expect, it } from "vitest";
import {
  buildWikiTopicPath,
  generateWikiIndexMarkdown,
  generateWikiTopicMarkdown,
  WIKI_TOOLS,
} from "./wikiEngine.js";
import { SafetyJailError } from "./safetyJail.js";

describe("wikiEngine", () => {
  it("exports wiki synthesize and index tool definitions", () => {
    expect(WIKI_TOOLS.map((t) => t.name)).toEqual([
      "wiki_synthesize_topic",
      "wiki_update_index",
    ]);
  });

  it("builds safe wiki topic path and rejects traversals", () => {
    expect(buildWikiTopicPath("Distributed Consensus")).toBe("Wiki/Distributed Consensus.md");
    expect(buildWikiTopicPath("Machine Learning", "Knowledge")).toBe("Knowledge/Machine Learning.md");

    expect(() => buildWikiTopicPath("../../etc/passwd")).toThrowError(SafetyJailError);
  });

  it("generates structured wiki topic markdown with wikilinks and citations", () => {
    const md = generateWikiTopicMarkdown({
      topicName: "Raft Consensus",
      summary: "Raft is a consensus algorithm designed for understandability.",
      keyConcepts: ["Leader Election", "Log Replication"],
      sources: [
        { path: "Notes/Reading.md", excerpt: "Raft paper notes from 2014" },
      ],
    });

    expect(md).toContain("type: wiki-topic");
    expect(md).toContain("# Raft Consensus");
    expect(md).toContain("## Key Concepts");
    expect(md).toContain("- [[Leader Election]]");
    expect(md).toContain("- [[Log Replication]]");
    expect(md).toContain("## Related Sources");
    expect(md).toContain("- [[Notes/Reading]]: _Raft paper notes from 2014_");
  });

  it("generates structured Map of Content index markdown", () => {
    const index = generateWikiIndexMarkdown([
      {
        category: "Computer Science",
        topics: [
          {
            name: "Raft Consensus",
            path: "Wiki/Raft Consensus.md",
            summary: "Understandable consensus algorithm.",
          },
        ],
      },
    ]);

    expect(index).toContain("# Knowledge Index (Map of Content)");
    expect(index).toContain("## Computer Science");
    expect(index).toContain("- [[Wiki/Raft Consensus|Raft Consensus]] — Understandable consensus algorithm.");
  });
});
