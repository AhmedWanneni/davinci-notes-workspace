import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { emptyNoteTagSet, type Note } from "@app/core-types";
import { buildGraph, updateGraphForNote } from "./buildGraph";
import { parseLinks } from "./parseLinks";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/vault",
);

const VAULT_PATHS = [
  "projects/alpha.md",
  "projects/beta-overview.md",
  "specs/Gamma Spec.md",
  "daily/standalone.md",
] as const;

function readFixture(relativePath: string): string {
  return readFileSync(join(FIXTURES, relativePath), "utf8");
}

function noteFromFixture(path: string, title: string): Note {
  const content = readFixture(path);
  return {
    path,
    title,
    frontmatter: {},
    content,
    outlinks: parseLinks(content, { notePaths: VAULT_PATHS, sourcePath: path }),
    tags: emptyNoteTagSet(),
    mtime: 0,
  };
}

function edgeKey(source: string, target: string): string {
  return `${source}->${target}`;
}

describe("buildGraph", () => {
  it("builds nodes, edges, and backlinks from a fixture vault", () => {
    const notes = [
      noteFromFixture("projects/alpha.md", "Project Alpha"),
      noteFromFixture("projects/beta-overview.md", "Beta Overview"),
      noteFromFixture("specs/Gamma Spec.md", "Gamma Spec"),
      noteFromFixture("daily/standalone.md", "Daily Standalone"),
    ];

    const graph = buildGraph(notes);

    expect(graph.nodes.size).toBeGreaterThanOrEqual(3);
    expect(graph.edges.length).toBeGreaterThan(0);

    const alphaBacklinks = graph.backlinks.get("projects/alpha.md") ?? [];
    expect(alphaBacklinks).toContain("projects/beta-overview.md");

    expect(
      graph.edges.some(
        (edge) =>
          edgeKey(edge.source, edge.target) ===
          "projects/alpha.md->projects/beta-overview.md",
      ),
    ).toBe(true);
  });

  it("updates only affected edges on incremental note change", () => {
    const alpha = noteFromFixture("projects/alpha.md", "Project Alpha");
    const beta = noteFromFixture("projects/beta-overview.md", "Beta Overview");
    const gamma = noteFromFixture("specs/Gamma Spec.md", "Gamma Spec");

    const graph = buildGraph([alpha, beta, gamma]);
    const edgesBefore = new Set(
      graph.edges.map((edge) => edgeKey(edge.source, edge.target)),
    );

    const previousAlpha = { ...alpha, outlinks: [...alpha.outlinks] };
    const updatedContent = readFixture("projects/alpha.md").replace(
      "[[delta-roadmap]]",
      "[[standalone]]",
    );
    const updatedAlpha: Note = {
      ...alpha,
      content: updatedContent,
      outlinks: parseLinks(updatedContent, {
        notePaths: VAULT_PATHS,
        sourcePath: alpha.path,
      }),
      tags: emptyNoteTagSet(),
    };

    updateGraphForNote(graph, updatedAlpha, previousAlpha);
    const edgesAfter = new Set(
      graph.edges.map((edge) => edgeKey(edge.source, edge.target)),
    );

    expect(edgesAfter.has("projects/alpha.md->daily/standalone.md")).toBe(true);
    expect(edgesBefore.has("projects/alpha.md->daily/standalone.md")).toBe(
      false,
    );

    const untouchedEdge = "projects/beta-overview.md->projects/alpha.md";
    expect(edgesBefore.has(untouchedEdge)).toBe(true);
    expect(edgesAfter.has(untouchedEdge)).toBe(true);

    expect(graph.backlinks.get("daily/standalone.md")).toContain(
      "projects/alpha.md",
    );
  });
});
