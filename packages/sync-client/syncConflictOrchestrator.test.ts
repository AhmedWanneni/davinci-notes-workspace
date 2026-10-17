import { describe, expect, it } from "vitest";
import {
  resolveConflictAction,
  resolveDeleteVsEdit,
  classifySyncDiff,
  generateManifest,
  type ManifestSnapshot,
} from "./index";

describe("ADR-0189 Conflict Resolution Orchestrator Tests", () => {
  it("Case 1: Same note edited offline, non-overlapping regions -> clean merge", () => {
    const base = "# Title\n\nSection 1 original\n\nSection 2 original\n";
    const local = "# Title\n\nSection 1 edited locally\n\nSection 2 original\n";
    const remote =
      "# Title\n\nSection 1 original\n\nSection 2 edited remotely\n";

    const res = resolveConflictAction({
      path: "Note.md",
      localDeleted: false,
      remoteDeleted: false,
      localContent: local,
      baseContent: base,
      remoteContent: remote,
      remoteDeviceName: "iPad",
      existingPaths: ["Note.md"],
    });

    expect(res.kind).toBe("clean-merge");
    expect(res.mergedContent).toContain("Section 1 edited locally");
    expect(res.mergedContent).toContain("Section 2 edited remotely");
    expect(res.mergedContent).not.toContain("<<<<<<<");
  });

  it("Case 2: Same note edited offline, overlapping regions -> conflict copy (both kept)", () => {
    const base = "# Title\n\nOriginal body line\n";
    const local = "# Title\n\nLocal replacement body\n";
    const remote = "# Title\n\nRemote replacement body\n";

    const res = resolveConflictAction({
      path: "Note.md",
      localDeleted: false,
      remoteDeleted: false,
      localContent: local,
      baseContent: base,
      remoteContent: remote,
      remoteDeviceName: "Phone",
      existingPaths: ["Note.md"],
    });

    expect(res.kind).toBe("conflict-copy");
    expect(res.copyPath).toBe("Note (Phone copy).md");
    expect(res.copyContent).toBe(remote);
  });

  it("Case 3a: Delete on local vs edit on remote -> remote edit wins", () => {
    const res = resolveDeleteVsEdit({
      path: "Note.md",
      localDeleted: true,
      remoteDeleted: false,
    });
    expect(res.winner).toBe("remote");
    expect(res.kind).toBe("delete-vs-edit-remote-wins");
  });

  it("Case 3b: Edit on local vs delete on remote -> local edit wins", () => {
    const res = resolveDeleteVsEdit({
      path: "Note.md",
      localDeleted: false,
      remoteDeleted: true,
    });
    expect(res.winner).toBe("local");
    expect(res.kind).toBe("delete-vs-edit-local-wins");
  });

  it("Case 4: Rename on one side vs edit on the other", () => {
    // NoteA was renamed to NoteB on local, but edited on remote
    const diff = classifySyncDiff(
      [
        {
          path: "NoteA.md",
          hash: "h-orig",
          size: 10,
          deviceClock: 2,
          deleted: true,
        },
        {
          path: "NoteB.md",
          hash: "h-orig",
          size: 10,
          deviceClock: 2,
          deleted: false,
        },
      ],
      [
        {
          path: "NoteA.md",
          hash: "h-orig",
          size: 10,
          deviceClock: 1,
          deleted: false,
        },
      ],
      [
        {
          path: "NoteA.md",
          hash: "h-remote",
          size: 25,
          deviceClock: 2,
          deleted: false,
        },
      ],
    );

    // NoteA has conflict (delete vs edit -> remote edit wins)
    const diffA = diff.find((d) => d.path === "NoteA.md")!;
    expect(diffA.classification).toBe("conflict");

    const resA = resolveConflictAction({
      path: "NoteA.md",
      localDeleted: true,
      remoteDeleted: false,
      remoteContent: "# Remote edit",
      remoteDeviceName: "Phone",
      existingPaths: ["NoteB.md"],
    });
    expect(resA.kind).toBe("delete-vs-edit-apply-remote");

    // NoteB is pushed
    const diffB = diff.find((d) => d.path === "NoteB.md")!;
    expect(diffB.classification).toBe("push");
  });

  it("Case 5: Rename on both sides to different names", () => {
    // Both sides deleted Old.md, device 1 added New1.md, device 2 added New2.md
    const diff = classifySyncDiff(
      [
        { path: "Old.md", hash: "h", size: 10, deviceClock: 2, deleted: true },
        {
          path: "New1.md",
          hash: "h",
          size: 10,
          deviceClock: 2,
          deleted: false,
        },
      ],
      [{ path: "Old.md", hash: "h", size: 10, deviceClock: 1, deleted: false }],
      [
        { path: "Old.md", hash: "h", size: 10, deviceClock: 2, deleted: true },
        {
          path: "New2.md",
          hash: "h",
          size: 10,
          deviceClock: 2,
          deleted: false,
        },
      ],
    );

    const oldDiff = diff.find((d) => d.path === "Old.md")!;
    expect(oldDiff.classification).toBe("no-op"); // deleted on both, no conflict

    const new1Diff = diff.find((d) => d.path === "New1.md")!;
    expect(new1Diff.classification).toBe("push");

    const new2Diff = diff.find((d) => d.path === "New2.md")!;
    expect(new2Diff.classification).toBe("pull");
  });

  it("Case 6: Same-named new note created on both devices with overlapping text", () => {
    const res = resolveConflictAction({
      path: "BrandNew.md",
      localDeleted: false,
      remoteDeleted: false,
      localContent: "# Brand New Note by Device 1\n",
      baseContent: "", // empty base
      remoteContent: "# Brand New Note by Device 2\n",
      remoteDeviceName: "MacBook",
      existingPaths: ["BrandNew.md"],
    });

    expect(res.kind).toBe("conflict-copy");
    expect(res.copyPath).toBe("BrandNew (MacBook copy).md");
  });

  it("Case 7: Folder move on one side vs edit inside folder on other", () => {
    // Device 1 moved FolderA/Note.md to FolderB/Note.md. Device 2 edited FolderA/Note.md.
    const diff = classifySyncDiff(
      [
        {
          path: "FolderA/Note.md",
          hash: "h1",
          size: 10,
          deviceClock: 2,
          deleted: true,
        },
        {
          path: "FolderB/Note.md",
          hash: "h1",
          size: 10,
          deviceClock: 2,
          deleted: false,
        },
      ],
      [
        {
          path: "FolderA/Note.md",
          hash: "h1",
          size: 10,
          deviceClock: 1,
          deleted: false,
        },
      ],
      [
        {
          path: "FolderA/Note.md",
          hash: "h2",
          size: 30,
          deviceClock: 2,
          deleted: false,
        },
      ],
    );

    const diffOld = diff.find((d) => d.path === "FolderA/Note.md")!;
    expect(diffOld.classification).toBe("conflict");

    const resOld = resolveConflictAction({
      path: "FolderA/Note.md",
      localDeleted: true,
      remoteDeleted: false,
      remoteContent: "# Edited inside Folder A",
      remoteDeviceName: "Desktop",
      existingPaths: ["FolderB/Note.md"],
    });
    expect(resOld.kind).toBe("delete-vs-edit-apply-remote");

    const diffNew = diff.find((d) => d.path === "FolderB/Note.md")!;
    expect(diffNew.classification).toBe("push");
  });

  it("Case 9: Clock skew between devices does not affect conflict detection or diff", async () => {
    // Device 1 has wall clock T; Device 2 has wall clock T + 3600000 (+1 hour)
    const baseSnapshot: ManifestSnapshot = {
      entries: [
        {
          path: "Skew.md",
          hash: "h-base",
          size: 10,
          deviceClock: 1,
          deleted: false,
        },
      ],
      metadata: { "Skew.md": { size: 10, mtimeMs: 1000000 } },
    };

    // Device 1 manifest generated at local clock
    const source1 = {
      listFiles: async () => [{ path: "Skew.md", size: 20, mtimeMs: 2000000 }],
      hashFile: async () => "h-edit-1",
    };
    const res1 = await generateManifest(source1, baseSnapshot, 1);

    // Device 2 manifest generated with +1 hour clock skew (mtimeMs + 3600000)
    const source2 = {
      listFiles: async () => [
        { path: "Skew.md", size: 30, mtimeMs: 2000000 + 3600000 },
      ],
      hashFile: async () => "h-edit-2",
    };
    const res2 = await generateManifest(source2, baseSnapshot, 1);

    // Compare diff: Wall clock mtime has zero influence on diff classification
    const diff = classifySyncDiff(
      res1.entries,
      baseSnapshot.entries,
      res2.entries,
    );
    expect(diff[0].classification).toBe("conflict");
    expect(diff[0].local?.deviceClock).toBe(2);
    expect(diff[0].remote?.deviceClock).toBe(2);
  });
});
