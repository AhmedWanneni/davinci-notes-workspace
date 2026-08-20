import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { emptyNoteTagSet, type Note } from "@app/core-types";
import { buildGraph } from "../buildGraph.ts";
import { parseFrontmatter } from "../parseFrontmatter.ts";
import { parseLinks } from "../parseLinks.ts";

const NOTE_COUNT = 350;
const OUT_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../fixtures/large-vault",
);

function generateVault(): string[] {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(join(OUT_DIR, "notes"), { recursive: true });

  const paths: string[] = [];
  for (let i = 0; i < NOTE_COUNT; i += 1) {
    paths.push(`notes/note-${String(i).padStart(4, "0")}.md`);
  }

  for (let i = 0; i < NOTE_COUNT; i += 1) {
    const path = paths[i]!;
    const prev = i > 0 ? paths[i - 1]! : paths[NOTE_COUNT - 1]!;
    const next = i < NOTE_COUNT - 1 ? paths[i + 1]! : paths[0]!;
    const stemPrev = prev.replace(/\.md$/, "").split("/").pop();
    const stemNext = next.replace(/\.md$/, "").split("/").pop();
    const body = `# Note ${i}\n\nSee [[${stemPrev}]] and [[${stemNext}|neighbor]].\n`;
    writeFileSync(join(OUT_DIR, path), body, "utf8");
  }

  return paths;
}

function buildNotes(paths: readonly string[]): Note[] {
  return paths.map((path, index) => {
    const content = readFileSync(join(OUT_DIR, path), "utf8");
    const { frontmatter, content: body } = parseFrontmatter(content);
    return {
      path,
      title: `Note ${index}`,
      frontmatter,
      content: body,
      outlinks: parseLinks(body, { notePaths: paths, sourcePath: path }),
      tags: emptyNoteTagSet(),
      mtime: 0,
    };
  });
}

function main(): void {
  const paths = generateVault();
  const started = performance.now();
  const notes = buildNotes(paths);
  const graph = buildGraph(notes);
  const elapsedMs = Math.round(performance.now() - started);

  console.log(
    JSON.stringify(
      {
        noteCount: notes.length,
        edgeCount: graph.edges.length,
        parseAndGraphMs: elapsedMs,
        outDir: OUT_DIR,
      },
      null,
      2,
    ),
  );
}

main();
