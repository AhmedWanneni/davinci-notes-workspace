import { describe, it, expect } from "vitest";
import { calculateGraphLanes } from "./calculateGraphLanes";
import type { GitCommitEntry } from "../types/gitTypes";

describe("calculateGraphLanes", () => {
  it("assigns single lane to linear commit history", () => {
    const commits: GitCommitEntry[] = [
      {
        hash: "c3",
        parents: ["c2"],
        authorName: "Alice",
        authorDate: 1003,
        subject: "Third",
        refs: "HEAD -> main",
      },
      {
        hash: "c2",
        parents: ["c1"],
        authorName: "Alice",
        authorDate: 1002,
        subject: "Second",
        refs: "",
      },
      {
        hash: "c1",
        parents: [],
        authorName: "Alice",
        authorDate: 1001,
        subject: "Initial",
        refs: "",
      },
    ];

    const nodes = calculateGraphLanes(commits);
    expect(nodes).toHaveLength(3);
    expect(nodes[0].lane).toBe(0);
    expect(nodes[1].lane).toBe(0);
    expect(nodes[2].lane).toBe(0);

    expect(nodes[0].connections).toEqual([{ fromLane: 0, toLane: 0 }]);
    expect(nodes[1].connections).toEqual([{ fromLane: 0, toLane: 0 }]);
    expect(nodes[2].connections).toEqual([]);
  });

  it("assigns distinct lanes for branching and merging commits", () => {
    // Merge commit c_merge has parents [c_main, c_feature]
    const commits: GitCommitEntry[] = [
      {
        hash: "c_merge",
        parents: ["c_main", "c_feat"],
        authorName: "Alice",
        authorDate: 2004,
        subject: "Merge branch 'feat'",
        refs: "HEAD -> main",
      },
      {
        hash: "c_feat",
        parents: ["c_base"],
        authorName: "Bob",
        authorDate: 2003,
        subject: "Feature work",
        refs: "feat",
      },
      {
        hash: "c_main",
        parents: ["c_base"],
        authorName: "Alice",
        authorDate: 2002,
        subject: "Main work",
        refs: "",
      },
      {
        hash: "c_base",
        parents: [],
        authorName: "Alice",
        authorDate: 2001,
        subject: "Base",
        refs: "",
      },
    ];

    const nodes = calculateGraphLanes(commits);
    expect(nodes).toHaveLength(4);

    // Merge node connects to both lanes
    expect(nodes[0].connections).toEqual([
      { fromLane: 0, toLane: 0 },
      { fromLane: 0, toLane: 1 },
    ]);
  });
});
