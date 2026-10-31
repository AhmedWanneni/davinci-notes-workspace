import { describe, expect, it } from "vitest";
import {
  assertSafeVaultPath,
  getFilenameStem,
  getParentFolder,
  isHiddenPath,
  isMarkdownPath,
  joinVaultPaths,
  normalizeToValidFileUri,
  normalizeVaultPath,
  toPosixPath,
} from "./pathUtils";

describe("pathUtils", () => {
  describe("normalizeToValidFileUri", () => {
    it("converts raw POSIX path with spaces to RFC 2396 file URI", () => {
      const input =
        "/data/user/0/com.davinci.notes/files/vaults/Personal Vault";
      const uri = normalizeToValidFileUri(input);
      expect(uri).toBe(
        "file:///data/user/0/com.davinci.notes/files/vaults/Personal%20Vault",
      );
      expect(uri.includes(" ")).toBe(false);
    });

    it("converts unencoded file URI with spaces to properly encoded file URI", () => {
      const input =
        "file:///data/user/0/com.davinci.notes/files/vaults/My Notes";
      const uri = normalizeToValidFileUri(input);
      expect(uri).toBe(
        "file:///data/user/0/com.davinci.notes/files/vaults/My%20Notes",
      );
      expect(uri.includes(" ")).toBe(false);
    });

    it("does not double-encode already encoded file URI", () => {
      const input =
        "file:///data/user/0/com.davinci.notes/files/vaults/Personal%20Vault";
      const uri = normalizeToValidFileUri(input);
      expect(uri).toBe(
        "file:///data/user/0/com.davinci.notes/files/vaults/Personal%20Vault",
      );
    });

    it("handles mixed encoded and unencoded path segments", () => {
      const input = "/storage/emulated/0/Vaults/My%20Folder/Sub Folder";
      const uri = normalizeToValidFileUri(input);
      expect(uri).toBe(
        "file:///storage/emulated/0/Vaults/My%20Folder/Sub%20Folder",
      );
    });

    it("preserves Android SAF content:// URIs completely untouched", () => {
      const input =
        "content://com.android.externalstorage.documents/tree/primary%3ADocuments";
      expect(normalizeToValidFileUri(input)).toBe(input);
    });

    it("handles trailing slashes cleanly", () => {
      const input =
        "/data/user/0/com.davinci.notes/files/vaults/Personal Vault/";
      expect(normalizeToValidFileUri(input)).toBe(
        "file:///data/user/0/com.davinci.notes/files/vaults/Personal%20Vault",
      );
    });

    it("handles relative path elements . and ..", () => {
      const input = "/data/user/0/com.davinci.notes/files/../files/vaults/v1";
      expect(normalizeToValidFileUri(input)).toBe(
        "file:///data/user/0/com.davinci.notes/files/vaults/v1",
      );
    });

    it("returns empty string for empty input", () => {
      expect(normalizeToValidFileUri("")).toBe("");
      expect(normalizeToValidFileUri("   ")).toBe("");
    });
  });

  describe("toPosixPath", () => {
    it("converts encoded file URI to decoded POSIX path", () => {
      const uri =
        "file:///data/user/0/com.davinci.notes/files/vaults/Personal%20Vault";
      expect(toPosixPath(uri)).toBe(
        "/data/user/0/com.davinci.notes/files/vaults/Personal Vault",
      );
    });

    it("preserves content:// URIs", () => {
      const uri = "content://saf/tree/123";
      expect(toPosixPath(uri)).toBe(uri);
    });

    it("returns raw POSIX path unchanged", () => {
      const path = "/data/user/0/com.davinci.notes/files/vaults/Personal Vault";
      expect(toPosixPath(path)).toBe(path);
    });
  });

  describe("vault path utilities", () => {
    it("normalizes vault path correctly", () => {
      expect(normalizeVaultPath("folder/sub/../note.md")).toBe(
        "folder/note.md",
      );
      expect(normalizeVaultPath("\\windows\\path.md")).toBe("windows/path.md");
    });

    it("detects hidden paths", () => {
      expect(isHiddenPath(".obsidian/config")).toBe(true);
      expect(isHiddenPath("folder/.trash/file.md")).toBe(true);
      expect(isHiddenPath("visible/note.md")).toBe(false);
    });

    it("detects markdown files", () => {
      expect(isMarkdownPath("note.md")).toBe(true);
      expect(isMarkdownPath("NOTE.MARKDOWN")).toBe(true);
      expect(isMarkdownPath("image.png")).toBe(false);
    });

    it("joins vault paths safely", () => {
      expect(joinVaultPaths("root", "sub", "file.md")).toBe("root/sub/file.md");
      expect(joinVaultPaths("root/", "/sub/")).toBe("root/sub");
    });

    it("assertSafeVaultPath prevents traversal and empty paths", () => {
      expect(() => assertSafeVaultPath("")).toThrow();
      expect(() => assertSafeVaultPath("/absolute/path")).toThrow();
      expect(() => assertSafeVaultPath("../escape")).toThrow();
      expect(() => assertSafeVaultPath("safe/path.md")).not.toThrow();
    });

    it("extracts parent folder and filename stem", () => {
      expect(getParentFolder("folder/sub/note.md")).toBe("folder/sub");
      expect(getParentFolder("note.md")).toBe("");
      expect(getFilenameStem("folder/note.md")).toBe("note");
      expect(getFilenameStem("archive.tar.gz")).toBe("archive.tar");
    });
  });
});
