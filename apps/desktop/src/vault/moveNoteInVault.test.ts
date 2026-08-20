import { describe, expect, it, vi } from "vitest";
import { moveNoteInVault } from "./moveNoteInVault";
import * as renameNoteModule from "./renameNoteInVault";

vi.mock("./renameNoteInVault", () => ({
  renameNoteInVault: vi.fn(),
}));

describe("moveNoteInVault", () => {
  it("constructs the correct new path and calls renameNoteInVault", async () => {
    const renameNoteInVaultSpy = vi.spyOn(renameNoteModule, "renameNoteInVault");
    renameNoteInVaultSpy.mockResolvedValue({ ok: true, newPath: "folder/note.md" });

    const result = await moveNoteInVault("note.md", "folder");

    expect(result).toEqual({ ok: true, newPath: "folder/note.md" });
    expect(renameNoteInVaultSpy).toHaveBeenCalledWith("note.md", "folder/note.md");
  });

  it("handles empty folder (move to root)", async () => {
    const renameNoteInVaultSpy = vi.spyOn(renameNoteModule, "renameNoteInVault");
    renameNoteInVaultSpy.mockResolvedValue({ ok: true, newPath: "note.md" });

    const result = await moveNoteInVault("folder/note.md", "");

    expect(result).toEqual({ ok: true, newPath: "note.md" });
    expect(renameNoteInVaultSpy).toHaveBeenCalledWith("folder/note.md", "note.md");
  });
});
