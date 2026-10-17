import { describe, expect, it } from "vitest";
import {
  isSyncthingConflictPath,
  isSyncthingTmpPath,
  parseSyncthingConflictInfo,
  findSyncthingConflictFiles,
} from "./conflicts";

describe("syncthing conflict and tmp recognizer", () => {
  it("detects conflict file paths", () => {
    expect(
      isSyncthingConflictPath("Note.sync-conflict-20261017-120000-ABCDEF.md"),
    ).toBe(true);
    expect(
      isSyncthingConflictPath("folder/Sub.sync-conflict-20261017-120000-ABCDEF.md"),
    ).toBe(true);
    expect(isSyncthingConflictPath("Normal Note.md")).toBe(false);
    expect(isSyncthingConflictPath("sync-conflict-folder/note.md")).toBe(false);
  });

  it("detects syncthing temporary sync files", () => {
    expect(isSyncthingTmpPath(".syncthing.LargeFile.pdf.tmp")).toBe(true);
    expect(isSyncthingTmpPath("folder/.syncthing.LargeFile.pdf.tmp")).toBe(true);
    expect(isSyncthingTmpPath("LargeFile.syncthing.tmp")).toBe(true);
    expect(isSyncthingTmpPath("attachment.sync-conflict-20261017.tmp")).toBe(true);
    expect(isSyncthingTmpPath("Normal.pdf")).toBe(false);
    expect(isSyncthingTmpPath("temp.tmp")).toBe(false);
  });

  it("parses conflict details and original path", () => {
    const parsed = parseSyncthingConflictInfo(
      "daily/Note.sync-conflict-20261017-120000-ABCDEF.md",
    );
    expect(parsed.originalPath).toBe("daily/Note.md");
    expect(parsed.originalFilename).toBe("Note.md");
    expect(parsed.conflictDetails).toBe("20261017-120000-ABCDEF");
  });

  it("filters all conflict files from a path list", () => {
    const paths = [
      "Note1.md",
      "Note1.sync-conflict-20261017-120000-AAA.md",
      "Images/photo.png",
      "Notes/Note2.sync-conflict-20261017-130000-BBB.md",
    ];
    const conflicts = findSyncthingConflictFiles(paths);
    expect(conflicts).toHaveLength(2);
    expect(conflicts[0].originalPath).toBe("Note1.md");
    expect(conflicts[1].originalPath).toBe("Notes/Note2.md");
  });
});
