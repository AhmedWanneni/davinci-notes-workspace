import { describe, expect, it, vi } from "vitest";
import {
  applyPlannedMutation,
  planMutation,
  VAULT_MUTATION_TOOLS,
  type VaultMutationBackend,
} from "./vaultMutationTools.js";
import { SafetyJailError } from "./safetyJail.js";

describe("vaultMutationTools", () => {
  const mockBackend: VaultMutationBackend = {
    readNote: vi.fn().mockImplementation((path: string) => {
      if (path === "Notes/Existing.md") return Promise.resolve("# Existing Note\nLine 1\nLine 2");
      return Promise.resolve(null);
    }),
    writeNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    moveNote: vi.fn().mockResolvedValue(undefined),
  };

  it("exports valid mutation tool declarations with schemas", () => {
    expect(VAULT_MUTATION_TOOLS.map((t) => t.name)).toEqual([
      "create_note",
      "edit_note",
      "append_to_note",
      "move_note",
      "delete_note",
      "create_database_table",
      "create_todo_list",
    ]);
  });

  it("plans create_note and generates line diff", async () => {
    const plan = await planMutation(
      "create_note",
      { path: "Notes/New.md", content: "# New Note\nBody line" },
      mockBackend,
    );

    expect(plan.changeRecord.action).toBe("create");
    expect(plan.changeRecord.path).toBe("Notes/New.md");
    expect(plan.changeRecord.beforeContent).toBeNull();
    expect(plan.changeRecord.afterContent).toBe("# New Note\nBody line");
    expect(plan.diff).toEqual([
      { kind: "added", text: "# New Note" },
      { kind: "added", text: "Body line" },
    ]);
  });

  it("plans edit_note on existing note and generates exact diff", async () => {
    const plan = await planMutation(
      "edit_note",
      { path: "Notes/Existing.md", content: "# Existing Note\nLine 1 modified\nLine 2" },
      mockBackend,
    );

    expect(plan.changeRecord.action).toBe("modify");
    expect(plan.diff.some((d) => d.kind === "removed" && d.text === "Line 1")).toBe(true);
    expect(plan.diff.some((d) => d.kind === "added" && d.text === "Line 1 modified")).toBe(true);
  });

  it("plans append_to_note at bottom and top", async () => {
    const planBottom = await planMutation(
      "append_to_note",
      { path: "Notes/Existing.md", content: "Appended at bottom", position: "bottom" },
      mockBackend,
    );
    expect(planBottom.changeRecord.afterContent).toContain("Line 2\n\nAppended at bottom\n");

    const planTop = await planMutation(
      "append_to_note",
      { path: "Notes/Existing.md", content: "Prepended at top", position: "top" },
      mockBackend,
    );
    expect(planTop.changeRecord.afterContent).toContain("Prepended at top\n\n# Existing Note");
  });

  it("plans create_database_table generating valid database markdown", async () => {
    const plan = await planMutation(
      "create_database_table",
      {
        path: "Finance/Invoices.md",
        title: "Invoices 2026",
        columns: [
          { name: "Invoice", type: "text" },
          { name: "Amount", type: "number" },
          { name: "Paid", type: "checkbox" },
        ],
        rows: [
          { Invoice: "INV-001", Amount: 1200, Paid: true },
          { Invoice: "INV-002", Amount: 350, Paid: false },
        ],
      },
      mockBackend,
    );

    const content = plan.changeRecord.afterContent ?? "";
    expect(content).toContain("database: table");
    expect(content).toContain("type: checkbox");
    expect(content).toContain("| Invoice | Amount | Paid |");
    expect(content).toContain("| INV-001 | 1200 | true |");
    expect(content).toContain("| INV-002 | 350 | false |");
  });

  it("plans create_todo_list generating checklist with (@YYYY-MM-DD HH:mm) reminder tokens", async () => {
    const plan = await planMutation(
      "create_todo_list",
      {
        path: "Tasks/Weekly.md",
        title: "Weekly Action Items",
        tasks: [
          { text: "Prepare financial report", dueAtUtc: "2026-10-28T09:00:00.000Z" },
          { text: "Call accountant", done: true, dueAtUtc: "2026-10-27T00:00:00.000Z" },
          { text: "Submit taxes", recurrence: "monthly" },
        ],
      },
      mockBackend,
    );

    const content = plan.changeRecord.afterContent ?? "";
    expect(content).toContain("# Weekly Action Items");
    expect(content).toContain("- [ ] Prepare financial report (@2026-10-28 09:00)");
    expect(content).toContain("- [x] Call accountant (@2026-10-27)");
    expect(content).toContain("- [ ] Submit taxes [repeat: monthly]");
  });

  it("applies planned mutations to backend", async () => {
    await applyPlannedMutation(
      { action: "create", path: "Notes/X.md", beforeContent: null, afterContent: "Hello" },
      mockBackend,
    );
    expect(mockBackend.writeNote).toHaveBeenCalledWith("Notes/X.md", "Hello");

    await applyPlannedMutation(
      { action: "delete", path: "Notes/X.md", beforeContent: "Hello", afterContent: null },
      mockBackend,
    );
    expect(mockBackend.deleteNote).toHaveBeenCalledWith("Notes/X.md");
  });

  it("rejects path traversal in mutation tools", async () => {
    await expect(
      planMutation("create_note", { path: "../../escape.md", content: "bad" }, mockBackend),
    ).rejects.toThrowError(SafetyJailError);
  });
});
