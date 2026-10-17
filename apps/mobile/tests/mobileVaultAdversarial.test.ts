import { describe, it, expect, beforeEach } from "vitest";
import { writeAttachment } from "@app/attachments";
import {
  MobileVaultStorageAdapter,
  diffVaultStats,
  assertSafeVaultPath,
} from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";

describe("Mobile Vault Adversarial Filenames & External Reconciler", () => {
  const VAULT_ROOT = `${documentDirectory}adv-vault/`;

  beforeEach(() => {
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
  });

  it("handles adversarial filenames: emoji, Arabic, accents, spaces, and 200+ char paths", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");

    const longFilename = "a".repeat(210) + ".md";
    const adversarialNotes = [
      "💡 project ideas.md",
      "ملاحظات/فكرة اليوم 🚀.md",
      "café résumé.md",
      "spaces/A Note With Many Spaces  2026.md",
      `nested/deep/${longFilename}`,
    ];

    for (const notePath of adversarialNotes) {
      await adapter.writeNote(notePath, `# ${notePath}\nContent`);
    }

    // Add hidden files that MUST be ignored
    inMemoryFs.set(`${VAULT_ROOT}.hidden_note.md`, {
      isDirectory: false,
      content: "secret",
      size: 6,
      mtime: Date.now(),
    });
    inMemoryFs.set(`${VAULT_ROOT}.git/HEAD`, {
      isDirectory: false,
      content: "ref: refs/heads/main",
      size: 21,
      mtime: Date.now(),
    });

    const scan = await adapter.scanVault();

    // 1. All adversarial notes must be found
    expect(scan.notes).toContain("💡 project ideas.md");
    expect(scan.notes).toContain("ملاحظات/فكرة اليوم 🚀.md");
    expect(scan.notes).toContain("café résumé.md");
    expect(scan.notes).toContain("spaces/A Note With Many Spaces  2026.md");
    expect(scan.notes).toContain(`nested/deep/${longFilename}`);

    // 2. Hidden files must NOT be indexed
    expect(scan.notes.some((p) => p.includes(".hidden_note"))).toBe(false);
    expect(scan.notes.some((p) => p.includes(".git"))).toBe(false);

    // 3. Round-trip read
    for (const notePath of adversarialNotes) {
      const readBack = await adapter.readNote(notePath);
      expect(readBack.content).toContain(notePath);
    }
  });

  it("detects external modifications, renames, and deletions via cheap mtime/size diff", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");

    // Baseline files
    await adapter.writeNote("NoteA.md", "Content A");
    await adapter.writeNote("NoteB.md", "Content B");
    await adapter.writeNote("NoteC.md", "Content C");

    const baselineScan = await adapter.scanVault();
    const previousStats = baselineScan.stats;

    // Simulate external changes (e.g. via Files app or Syncthing)
    // 1. Modify NoteA.md (change size and mtime)
    inMemoryFs.set(`${VAULT_ROOT}NoteA.md`, {
      isDirectory: false,
      content: "Content A Modified by External Editor",
      size: 37,
      mtime: Date.now() + 5000,
    });

    // 2. Rename NoteB.md -> NoteB_Renamed.md (same size, preserved mtime)
    const prevB = previousStats["NoteB.md"];
    inMemoryFs.delete(`${VAULT_ROOT}NoteB.md`);
    inMemoryFs.set(`${VAULT_ROOT}NoteB_Renamed.md`, {
      isDirectory: false,
      content: "Content B",
      size: prevB.size,
      mtime: prevB.mtime,
    });

    // 3. Delete NoteC.md
    inMemoryFs.delete(`${VAULT_ROOT}NoteC.md`);

    // 4. Add NoteD.md externally
    inMemoryFs.set(`${VAULT_ROOT}NoteD.md`, {
      isDirectory: false,
      content: "Brand new external note",
      size: 24,
      mtime: Date.now() + 6000,
    });

    // Rescan stats only
    const rescan = await adapter.scanVault();
    const diff = diffVaultStats(previousStats, rescan.stats);

    // Assertions
    expect(diff.changed).toEqual(["NoteA.md"]);
    expect(diff.renamed).toEqual([
      { from: "NoteB.md", to: "NoteB_Renamed.md" },
    ]);
    expect(diff.removed).toEqual(["NoteC.md"]);
    expect(diff.added).toEqual(["NoteD.md"]);
  });

  it("integrates seamlessly with @app/attachments writeAttachment pipeline", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    // Write first attachment
    const path1 = await writeAttachment(
      adapter,
      VAULT_ROOT,
      "Attachments",
      "diagram.png",
      testData,
    );
    expect(path1).toContain("diagram.png");
    expect(await adapter.exists(path1)).toBe(true);

    // Write second attachment with identical name -> collision suffixing
    const path2 = await writeAttachment(
      adapter,
      VAULT_ROOT,
      "Attachments",
      "diagram.png",
      testData,
    );
    expect(path2).toContain("diagram 1.png");
    expect(await adapter.exists(path2)).toBe(true);
  });

  it("verifies note CRUD lifecycle directly on the underlying filesystem", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");

    // 1. Missing file: readNote throws
    await expect(adapter.readNote("non-existent.md")).rejects.toThrow(
      "Note not found: non-existent.md",
    );

    // 2. Folder that does not exist yet: writeNote auto-creates parent folders
    const nestedPath = "uncreated/deep/sub/NewNote.md";
    await adapter.writeNote(nestedPath, "# Deep Note\nInitial text");
    const created = await adapter.readNote(nestedPath);
    expect(created.content).toBe("# Deep Note\nInitial text");
    // Verify on filesystem directly
    const directFileKey = adapter.resolveFileUri(nestedPath);
    expect(inMemoryFs.get(directFileKey.replace(/\/+$/, ""))?.content).toBe(
      "# Deep Note\nInitial text",
    );

    // 3. Edit note
    await adapter.writeNote(nestedPath, "# Deep Note\nEdited text");
    const edited = await adapter.readNote(nestedPath);
    expect(edited.content).toBe("# Deep Note\nEdited text");
    expect(inMemoryFs.get(directFileKey.replace(/\/+$/, ""))?.content).toBe(
      "# Deep Note\nEdited text",
    );

    // 4. Rename note
    const renamedPath = "uncreated/deep/sub/RenamedNote.md";
    await adapter.renameNote(nestedPath, renamedPath);
    expect(await adapter.exists(nestedPath)).toBe(false);
    expect(await adapter.exists(renamedPath)).toBe(true);
    expect(inMemoryFs.has(directFileKey.replace(/\/+$/, ""))).toBe(false);
    const renamedKey = adapter.resolveFileUri(renamedPath).replace(/\/+$/, "");
    expect(inMemoryFs.get(renamedKey)?.content).toBe(
      "# Deep Note\nEdited text",
    );

    // 5. Move note to different folder
    const movedPath = "other-folder/MovedNote.md";
    await adapter.renameNote(renamedPath, movedPath);
    expect(await adapter.exists(renamedPath)).toBe(false);
    expect(await adapter.exists(movedPath)).toBe(true);
    const movedKey = adapter.resolveFileUri(movedPath).replace(/\/+$/, "");
    expect(inMemoryFs.get(movedKey)?.content).toBe("# Deep Note\nEdited text");

    // 6. Delete note
    await adapter.deleteNote(movedPath);
    expect(await adapter.exists(movedPath)).toBe(false);
    expect(inMemoryFs.has(movedKey)).toBe(false);
  });

  it("strictly rejects path traversal attacks", () => {
    expect(() => assertSafeVaultPath("../escape.md")).toThrow("Path traversal");
    expect(() => assertSafeVaultPath("sub/../../escape.md")).toThrow(
      "Path traversal",
    );
    expect(() => assertSafeVaultPath("null\0byte.md")).toThrow("null bytes");
  });
});
