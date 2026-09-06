// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { afterEach, describe, expect, it } from "vitest";

let vaultPath = "";

function git(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd: vaultPath });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args.join(" ")} exited ${code}`));
    });
  });
}

afterEach(async () => {
  if (vaultPath) await rm(vaultPath, { recursive: true, force: true });
  vaultPath = "";
});

describe("local version history latency", () => {
  it("keeps input-loop latency below 50ms during a large local commit", async () => {
    vaultPath = await mkdtemp(join(tmpdir(), "davinci-git-latency-"));
    const notePath = join(vaultPath, "large.md");
    await git(["init", "--quiet"]);
    await writeFile(notePath, "# Large\ninitial\n");
    await git(["add", "large.md"]);
    await git([
      "-c",
      "user.name=DaVinci Notes",
      "-c",
      "user.email=local-history@davinci.notes",
      "commit",
      "--quiet",
      "-m",
      "Initial version",
    ]);
    await writeFile(notePath, `# Large\n${"edited content\n".repeat(150_000)}`);

    let maxLatencyMs = 0;
    let expected = performance.now() + 5;
    const timer = setInterval(() => {
      const now = performance.now();
      maxLatencyMs = Math.max(maxLatencyMs, now - expected);
      expected = now + 5;
    }, 5);

    await git(["add", "--", "large.md"]);
    await git([
      "-c",
      "user.name=DaVinci Notes",
      "-c",
      "user.email=local-history@davinci.notes",
      "commit",
      "--quiet",
      "-m",
      "Auto-save: large",
    ]);
    clearInterval(timer);

    console.info(
      `Local Git large-edit max input latency: ${maxLatencyMs.toFixed(2)}ms`,
    );
    expect(maxLatencyMs).toBeLessThan(50);
  });
});
