import type Database from "@tauri-apps/plugin-sql";
import { describe, expect, it, vi } from "vitest";
import { emptyNoteTagSet, type Note } from "@app/core-types";
import { replaceFtsRows } from "./sqliteFtsIndex";

function note(path: string, content: string): Note {
  return {
    path,
    title: path,
    content,
    frontmatter: {},
    tags: emptyNoteTagSet(),
    outlinks: [],
    mtime: 1,
  };
}

describe("sqlite FTS maintenance", () => {
  it("replaces only the supplied note rows and preserves body content", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    await replaceFtsRows(
      { execute } as unknown as Database,
      [note("new.md", "# Updated heading\nbody")],
    );

    expect(execute).toHaveBeenNthCalledWith(
      1,
      "DELETE FROM notes_fts WHERE path IN ($1)",
      ["new.md"],
    );
    expect(execute).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO notes_fts (path, content) VALUES ($1, $2)",
      ["new.md", "# Updated heading\nbody"],
    );
  });

  it("keeps a 1,000-note FTS batch update bounded", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const notes = Array.from({ length: 1000 }, (_, index) =>
      note(`notes/${index}.md`, `# Note ${index}\n\nbenchmark body text`),
    );
    const started = performance.now();

    await replaceFtsRows({ execute } as unknown as Database, notes);

    const elapsedMs = performance.now() - started;
    expect(execute).toHaveBeenCalledTimes(2);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
