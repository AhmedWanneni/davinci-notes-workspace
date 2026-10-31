import { describe, expect, it, beforeEach } from "vitest";
import * as FileSystem from "expo-file-system/legacy";
import { checkFolderAccess } from "./folderAccessChecker";
import { resetInMemoryFs } from "../../tests/mocks/expoFileSystemMock";

describe("folderAccessChecker", () => {
  const testDirUri = "file:///app/sandbox/documents/vaults/TestVault/";

  beforeEach(() => {
    resetInMemoryFs();
  });

  it("returns error for empty path", async () => {
    const res = await checkFolderAccess("");
    expect(res.accessible).toBe(false);
    expect(res.error).toBe("Target path cannot be empty");
  });

  it("returns error for content:// SAF uris", async () => {
    const res = await checkFolderAccess(
      "content://com.android.externalstorage.documents/tree/primary",
    );
    expect(res.accessible).toBe(false);
    expect(res.error).toContain("Syncthing requires app sandbox storage");
  });

  it("verifies accessible empty directory", async () => {
    await FileSystem.makeDirectoryAsync(testDirUri, { intermediates: true });

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(false);
  });

  it("detects non-empty directory with user files", async () => {
    await FileSystem.makeDirectoryAsync(testDirUri, { intermediates: true });
    await FileSystem.writeAsStringAsync(`${testDirUri}My Note.md`, "# Hello");

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(true);
  });

  it("ignores sync metadata when checking non-empty status", async () => {
    await FileSystem.makeDirectoryAsync(testDirUri, { intermediates: true });
    await FileSystem.writeAsStringAsync(`${testDirUri}.stignore`, "(?d).DS_Store");

    const res = await checkFolderAccess(testDirUri);
    expect(res.accessible).toBe(true);
    expect(res.isNonEmpty).toBe(false);
  });
});
