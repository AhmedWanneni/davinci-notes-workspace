import { describe, expect, it, beforeEach } from "vitest";
import { Directory, File } from "expo-file-system";
import { checkFolderAccess } from "./folderAccessChecker";
import { resetInMemoryFs } from "../../tests/mocks/expoFileSystemMock";

describe("folderAccessChecker", () => {
  const testDirUri = "file:///app/sandbox/documents/vaults/TestVault";

  beforeEach(() => {
    resetInMemoryFs();
  });

  it("returns error for empty path", async () => {
    const res = await checkFolderAccess("");
    expect(res.accessible).toBe(false);
    expect(res.error).toBe("Target path cannot be empty");
  });

  it("verifies accessible empty directory", async () => {
    const dir = new Directory(testDirUri);
    dir.create({ intermediates: true });

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(false);
  });

  it("detects non-empty directory with user files", async () => {
    const dir = new Directory(testDirUri);
    dir.create({ intermediates: true });

    const note = new File(dir, "My Note.md");
    note.write("# Hello");

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(true);
  });

  it("ignores sync metadata when checking non-empty status", async () => {
    const dir = new Directory(testDirUri);
    dir.create({ intermediates: true });

    const stignore = new File(dir, ".stignore");
    stignore.write("(?d).DS_Store");

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(false);
  });
});
