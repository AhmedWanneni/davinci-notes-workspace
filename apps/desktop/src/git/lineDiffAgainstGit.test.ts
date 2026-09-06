// @vitest-environment node
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { lineDiff } from "./lineDiff";

const run = promisify(execFile);
let vaultPath = "";

async function git(args: string[]) {
  return run("git", args, { cwd: vaultPath });
}

afterEach(async () => {
  if (vaultPath) await rm(vaultPath, { recursive: true, force: true });
  vaultPath = "";
});

describe("lineDiff against Git", () => {
  it("renders the changed lines reported by a real Git diff", async () => {
    vaultPath = await mkdtemp(join(tmpdir(), "davinci-history-diff-"));
    await git(["init", "--quiet"]);
    await writeFile(join(vaultPath, "note.md"), "# Note\nfirst\n");
    await git(["add", "note.md"]);
    await git([
      "-c",
      "user.name=DaVinci Notes",
      "-c",
      "user.email=local-history@davinci.notes",
      "commit",
      "--quiet",
      "-m",
      "Auto-save: note",
    ]);
    const { stdout: firstRevision } = await git(["rev-parse", "HEAD"]);
    await writeFile(join(vaultPath, "note.md"), "# Note\nsecond\n");
    await git(["add", "note.md"]);
    await git([
      "-c",
      "user.name=DaVinci Notes",
      "-c",
      "user.email=local-history@davinci.notes",
      "commit",
      "--quiet",
      "-m",
      "Auto-save: note",
    ]);
    const { stdout: secondRevision } = await git(["rev-parse", "HEAD"]);

    const [{ stdout: gitDiff }, { stdout: first }, { stdout: second }] =
      await Promise.all([
        git([
          "diff",
          "--no-ext-diff",
          firstRevision.trim(),
          secondRevision.trim(),
          "--",
          "note.md",
        ]),
        git(["show", `${firstRevision.trim()}:note.md`]),
        git(["show", `${secondRevision.trim()}:note.md`]),
      ]);
    const renderedChanges = lineDiff(first, second)
      .filter((line) => line.kind !== "unchanged")
      .map((line) => `${line.kind === "removed" ? "-" : "+"}${line.text}`);

    expect(gitDiff).toContain("-first");
    expect(gitDiff).toContain("+second");
    expect(renderedChanges).toEqual(["-first", "+second"]);
  });
});
