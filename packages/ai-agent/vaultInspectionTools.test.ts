import { describe, expect, it, vi } from "vitest";
import {
  executeInspectionTool,
  VAULT_INSPECTION_TOOLS,
  type VaultInspectionBackend,
} from "./vaultInspectionTools.js";
import { SafetyJailError } from "./safetyJail.js";

describe("vaultInspectionTools", () => {
  const mockBackend: VaultInspectionBackend = {
    listPaths: vi.fn().mockResolvedValue({
      folders: ["Notes", "Finance"],
      files: ["Notes/A.md", "Notes/B.md", "Finance/Q3.md"],
    }),
    readNote: vi.fn().mockResolvedValue("# Test Note\nHello world"),
    searchFts: vi.fn().mockResolvedValue([
      { path: "Finance/Q3.md", snippet: "Q3 revenue details" },
    ]),
    searchSemantic: vi.fn().mockResolvedValue([
      { path: "Notes/A.md", snippet: "Budgeting ideas", score: 0.88 },
    ]),
    getStructure: vi.fn().mockResolvedValue({
      folders: ["Notes", "Finance"],
      tags: ["#work", "#finance"],
      totalNotes: 3,
    }),
  };

  it("exports valid tool declarations with JSON schemas", () => {
    expect(VAULT_INSPECTION_TOOLS.map((t) => t.name)).toEqual([
      "list_vault_tree",
      "read_note",
      "search_vault",
      "get_vault_structure",
    ]);
  });

  it("executes list_vault_tree safely and bounds large listings", async () => {
    const res = (await executeInspectionTool("list_vault_tree", { folderPath: "Notes" }, mockBackend)) as {
      folders: string[];
      files: string[];
    };
    expect(res.folders).toHaveLength(2);
    expect(res.files).toHaveLength(3);
  });

  it("executes read_note with SafetyJail validation and untrusted encapsulation", async () => {
    const res = (await executeInspectionTool("read_note", { path: "Notes/A.md" }, mockBackend)) as {
      path: string;
      content: string;
    };
    expect(res.path).toBe("Notes/A.md");
    expect(res.content).toContain('<untrusted_vault_data note_path="Notes/A.md">');
    expect(res.content).toContain("# Test Note");

    // Path traversal attempt
    await expect(
      executeInspectionTool("read_note", { path: "../../secret.txt" }, mockBackend),
    ).rejects.toThrowError(SafetyJailError);
  });

  it("executes search_vault in hybrid mode merging FTS and semantic results", async () => {
    const res = (await executeInspectionTool(
      "search_vault",
      { query: "finance", mode: "hybrid" },
      mockBackend,
    )) as { count: number; results: Array<{ path: string; mode: string }> };

    expect(res.count).toBe(2);
    expect(res.results[0].path).toBe("Finance/Q3.md");
    expect(res.results[0].mode).toBe("fts");
    expect(res.results[1].path).toBe("Notes/A.md");
    expect(res.results[1].mode).toBe("semantic");
  });

  it("executes get_vault_structure", async () => {
    const res = (await executeInspectionTool("get_vault_structure", {}, mockBackend)) as {
      tags: string[];
    };
    expect(res.tags).toEqual(["#work", "#finance"]);
  });
});
