import { describe, expect, it } from "vitest";
import { classifySyncDiff } from "./syncDiff";
import type { ManifestEntry } from "./manifest";

const entry = (path: string, hash: string, deleted = false): ManifestEntry => ({
  path,
  hash,
  size: hash.length,
  deviceClock: 1,
  deleted,
});

describe("three-way sync diff", () => {
  it("classifies push, pull, no-op, and conflict", () => {
    const base = [
      entry("push", "a"),
      entry("pull", "a"),
      entry("same", "a"),
      entry("both", "a"),
    ];
    const local = [
      entry("push", "b"),
      entry("pull", "a"),
      entry("same", "a"),
      entry("both", "b"),
    ];
    const remote = [
      entry("push", "a"),
      entry("pull", "b"),
      entry("same", "a"),
      entry("both", "c"),
    ];
    expect(
      classifySyncDiff(local, base, remote).map((item) => item.classification),
    ).toEqual(["conflict", "pull", "push", "no-op"]);
  });

  it("pushes a new local file and a local tombstone", () => {
    const result = classifySyncDiff(
      [entry("new", "n"), entry("gone", "g", true)],
      [entry("gone", "g")],
      [entry("gone", "g")],
    );
    expect(result).toEqual([
      expect.objectContaining({ path: "gone", classification: "push" }),
      expect.objectContaining({ path: "new", classification: "push" }),
    ]);
  });

  it("pulls a remote deletion when local did not change", () => {
    const result = classifySyncDiff(
      [entry("note", "a")],
      [entry("note", "a")],
      [entry("note", "a", true)],
    );
    expect(result[0]).toMatchObject({
      path: "note",
      classification: "pull",
      remote: { deleted: true },
    });
  });
});
