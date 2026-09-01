import { describe, expect, it } from "vitest";
import {
  findSyncthingConflictFiles,
  isSyncthingConflictPath,
  parseSyncthingConflictInfo,
} from "./syncthingConflicts";

describe("Syncthing Conflict Recognition", () => {
  it("detects Syncthing conflict filename patterns", () => {
    expect(
      isSyncthingConflictPath(
        "daily/note.sync-conflict-20260901-120000-DEV1.md",
      ),
    ).toBe(true);
    expect(
      isSyncthingConflictPath(
        "canvas/board.sync-conflict-20260901-120000.canvas",
      ),
    ).toBe(true);
    expect(isSyncthingConflictPath("daily/note.md")).toBe(false);
    expect(isSyncthingConflictPath("sync-conflict-folder/normal.md")).toBe(
      false,
    );
  });

  it("parses conflict path details into original path and conflict metadata", () => {
    const parsed = parseSyncthingConflictInfo(
      "notes/project.sync-conflict-20260901-143000-LAPTOP.md",
    );

    expect(parsed.path).toBe(
      "notes/project.sync-conflict-20260901-143000-LAPTOP.md",
    );
    expect(parsed.originalPath).toBe("notes/project.md");
    expect(parsed.filename).toBe(
      "project.sync-conflict-20260901-143000-LAPTOP.md",
    );
    expect(parsed.originalFilename).toBe("project.md");
    expect(parsed.conflictDetails).toBe("20260901-143000-LAPTOP");
  });

  it("filters all conflict files from vault paths list", () => {
    const paths = [
      "notes/a.md",
      "notes/a.sync-conflict-20260901-100000.md",
      "notes/b.md",
      "attachments/image.sync-conflict-20260901-110000-DEV.png",
    ];

    const conflicts = findSyncthingConflictFiles(paths);
    expect(conflicts.length).toBe(2);
    expect(conflicts[0].originalPath).toBe("notes/a.md");
    expect(conflicts[1].originalPath).toBe("attachments/image.png");
  });
});
