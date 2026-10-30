import { describe, expect, it } from "vitest";
import { SafetyJailError, validateVaultRelativePath } from "./safetyJail.js";

describe("SafetyJail", () => {
  it("allows clean note paths and folders", () => {
    expect(validateVaultRelativePath("Notes/Todo.md")).toBe("Notes/Todo.md");
    expect(validateVaultRelativePath("Finance/Q3.md")).toBe("Finance/Q3.md");
    expect(validateVaultRelativePath("./Ideas/Project.md")).toBe("Ideas/Project.md");
    expect(validateVaultRelativePath("Nested/Folder/Deep/Note.md")).toBe("Nested/Folder/Deep/Note.md");
  });

  it("normalises Windows backslashes", () => {
    expect(validateVaultRelativePath("Notes\\Work\\Tasks.md")).toBe("Notes/Work/Tasks.md");
  });

  it("permits allowed .davinci/agent/ directory files", () => {
    expect(validateVaultRelativePath(".davinci/agent/history.json")).toBe(".davinci/agent/history.json");
    expect(validateVaultRelativePath(".davinci/agent/shortcuts.json")).toBe(".davinci/agent/shortcuts.json");
  });

  it("rejects path traversal attempts (..)", () => {
    expect(() => validateVaultRelativePath("../../etc/passwd")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("Notes/../../secrets.txt")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("..")).toThrowError(SafetyJailError);
  });

  it("rejects absolute paths", () => {
    expect(() => validateVaultRelativePath("/Users/admin/vault/Note.md")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("C:\\Windows\\System32")).toThrowError(SafetyJailError);
  });

  it("rejects .git and .trash access", () => {
    expect(() => validateVaultRelativePath(".git/config")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath(".git")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath(".trash/deleted.md")).toThrowError(SafetyJailError);
  });

  it("rejects unauthorized .davinci internal files", () => {
    expect(() => validateVaultRelativePath(".davinci/bookmarks.json")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath(".davinci/config.json")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath(".davinci")).toThrowError(SafetyJailError);
  });

  it("rejects null bytes and reserved device names", () => {
    expect(() => validateVaultRelativePath("Note\0.md")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("CON.md")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("NUL")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("Folder/AUX/Note.md")).toThrowError(SafetyJailError);
  });

  it("rejects hidden OS system files", () => {
    expect(() => validateVaultRelativePath(".DS_Store")).toThrowError(SafetyJailError);
    expect(() => validateVaultRelativePath("Notes/Thumbs.db")).toThrowError(SafetyJailError);
  });
});
