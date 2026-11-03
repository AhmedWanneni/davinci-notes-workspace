// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadLibraryItemsFromVault,
  saveLibraryItemToVault,
  deleteLibraryItemFromVault,
} from "./libraryVaultStorage";
import * as vaultCommands from "../../../vault/vaultCommands";
import type { LibraryItem } from "@app/ai-agent";

vi.mock("../../../vault/vaultCommands", () => ({
  listNotes: vi.fn(),
  readNote: vi.fn(),
  writeNote: vi.fn(),
  deleteNote: vi.fn(),
}));

describe("libraryVaultStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testItem: LibraryItem = {
    id: "lib-custom",
    title: "Sprint Review Checklist",
    type: "skill",
    description: "Checklist for sprint reviews",
    content: "Review sprint goals, metrics, and retros.",
    tags: ["Agile"],
    createdAt: 1000,
    updatedAt: 1000,
  };

  it("saves library item to correct subfolder in ai-library", async () => {
    vi.mocked(vaultCommands.writeNote).mockResolvedValue({
      exists: true,
      mtime: 1,
      size: 100,
    });

    const saved = await saveLibraryItemToVault(testItem);
    expect(saved.filePath).toBe("ai-library/skills/Sprint Review Checklist.md");
    expect(vaultCommands.writeNote).toHaveBeenCalledWith(
      "ai-library/skills/Sprint Review Checklist.md",
      expect.stringContaining('title: "Sprint Review Checklist"'),
    );
  });

  it("loads library items from markdown files in vault", async () => {
    vi.mocked(vaultCommands.listNotes).mockResolvedValue([
      "Notes/Daily.md",
      "ai-library/skills/Sprint Review Checklist.md",
    ]);

    const mdContent = `---
title: "Sprint Review Checklist"
type: "skill"
description: "Checklist for sprint reviews"
tags: ["Agile"]
id: "lib-custom"
---
Review sprint goals, metrics, and retros.`;

    vi.mocked(vaultCommands.readNote).mockResolvedValue({
      path: "ai-library/skills/Sprint Review Checklist.md",
      content: mdContent,
      mtime: 1000,
      size: 200,
    });

    const items = await loadLibraryItemsFromVault([]);
    expect(items.length).toBeGreaterThan(0);
    const sprintItem = items.find((i) => i.id === "lib-custom");
    expect(sprintItem).toBeTruthy();
    expect(sprintItem?.title).toBe("Sprint Review Checklist");
    expect(sprintItem?.type).toBe("skill");
    expect(sprintItem?.content).toBe(
      "Review sprint goals, metrics, and retros.",
    );
  });

  it("deletes markdown note when item is deleted", async () => {
    vi.mocked(vaultCommands.deleteNote).mockResolvedValue(undefined);

    await deleteLibraryItemFromVault({
      ...testItem,
      filePath: "ai-library/skills/Sprint Review Checklist.md",
    });

    expect(vaultCommands.deleteNote).toHaveBeenCalledWith(
      "ai-library/skills/Sprint Review Checklist.md",
    );
  });
});
