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
      if (path === "Notes/Existing.md")
        return Promise.resolve("# Existing Note\nLine 1\nLine 2");
      return Promise.resolve(null);
    }),
    writeNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    moveNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
    deleteFolder: vi.fn().mockResolvedValue(undefined),
  };

  it("exports valid mutation tool declarations including folder and kanban", () => {
    expect(VAULT_MUTATION_TOOLS.map((t) => t.name)).toEqual([
      "create_note",
      "create_folder",
      "create_kanban_board",
      "edit_note",
      "append_to_note",
      "move_note",
      "delete_note",
      "create_database_table",
      "create_todo_list",
      "save_memory",
    ]);
  });

  it("plans create_note and automatically appends .md if missing", async () => {
    const plan = await planMutation(
      "create_note",
      { path: "Notes/NewNote", content: "# New Note\nBody line" },
      mockBackend,
    );

    expect(plan.changeRecord.action).toBe("create");
    expect(plan.changeRecord.path).toBe("Notes/NewNote.md");
    expect(plan.changeRecord.beforeContent).toBeNull();
    expect(plan.changeRecord.afterContent).toBe("# New Note\nBody line");
  });

  it("plans create_folder and executes createFolder on backend", async () => {
    const plan = await planMutation(
      "create_folder",
      { path: "/Projects/Agent/ " },
      mockBackend,
    );

    expect(plan.changeRecord.action).toBe("create");
    expect(plan.changeRecord.path).toBe("Projects/Agent");
    expect(plan.changeRecord.afterContent).toBeNull();

    await applyPlannedMutation(plan.changeRecord, mockBackend);
    expect(mockBackend.createFolder).toHaveBeenCalledWith("Projects/Agent");
  });

  it("plans create_kanban_board with lanes and cards", async () => {
    const plan = await planMutation(
      "create_kanban_board",
      {
        path: "Projects/Sprint",
        title: "Sprint Board",
        lanes: [
          { name: "To Do", cards: ["Fix bug"] },
          { name: "Done", cards: ["Refactor"] },
        ],
      },
      mockBackend,
    );

    expect(plan.changeRecord.path).toBe("Projects/Sprint.md");
    expect(plan.changeRecord.afterContent).toContain("kanban-plugin: board");
    expect(plan.changeRecord.afterContent).toContain("# Sprint Board");
    expect(plan.changeRecord.afterContent).toContain("## To Do\n- [ ] Fix bug");
  });

  it("plans edit_note on existing note and generates exact diff", async () => {
    const plan = await planMutation(
      "edit_note",
      {
        path: "Notes/Existing.md",
        content: "# Existing Note\nLine 1 modified\nLine 2",
      },
      mockBackend,
    );

    expect(plan.changeRecord.action).toBe("modify");
    expect(
      plan.diff.some((d) => d.kind === "removed" && d.text === "Line 1"),
    ).toBe(true);
    expect(
      plan.diff.some((d) => d.kind === "added" && d.text === "Line 1 modified"),
    ).toBe(true);
  });

  it("plans append_to_note at bottom and top", async () => {
    const planBottom = await planMutation(
      "append_to_note",
      {
        path: "Notes/Existing.md",
        content: "Appended at bottom",
        position: "bottom",
      },
      mockBackend,
    );
    expect(planBottom.changeRecord.afterContent).toContain(
      "Line 2\n\nAppended at bottom\n",
    );

    const planTop = await planMutation(
      "append_to_note",
      {
        path: "Notes/Existing.md",
        content: "Prepended at top",
        position: "top",
      },
      mockBackend,
    );
    expect(planTop.changeRecord.afterContent).toContain(
      "Prepended at top\n\n# Existing Note",
    );
  });

  it("plans create_database_table with fallback default columns when omitted", async () => {
    const plan = await planMutation(
      "create_database",
      { path: "Projects/Tracker", title: "Tracker" },
      mockBackend,
    );

    expect(plan.changeRecord.path).toBe("Projects/Tracker.md");
    const content = plan.changeRecord.afterContent ?? "";
    expect(content).toContain("database: table");
    expect(content).toContain("| Name | Status | Date |");
  });

  it("plans create_todo_list generating checklist with reminder tokens", async () => {
    const plan = await planMutation(
      "create_todo_list",
      {
        path: "Tasks/Weekly.md",
        title: "Weekly Action Items",
        tasks: [
          {
            text: "Prepare financial report",
            dueAtUtc: "2026-10-28T09:00:00.000Z",
          },
          {
            text: "Call accountant",
            done: true,
            dueAtUtc: "2026-10-27T00:00:00.000Z",
          },
        ],
      },
      mockBackend,
    );

    const content = plan.changeRecord.afterContent ?? "";
    expect(content).toContain("# Weekly Action Items");
    expect(content).toContain(
      "- [ ] Prepare financial report (@2026-10-28 09:00)",
    );
  });

  it("applies planned mutations to backend", async () => {
    await applyPlannedMutation(
      {
        action: "create",
        path: "Notes/X.md",
        beforeContent: null,
        afterContent: "Hello",
      },
      mockBackend,
    );
    expect(mockBackend.writeNote).toHaveBeenCalledWith("Notes/X.md", "Hello");

    await applyPlannedMutation(
      {
        action: "delete",
        path: "Notes/X.md",
        beforeContent: "Hello",
        afterContent: null,
      },
      mockBackend,
    );
    expect(mockBackend.deleteNote).toHaveBeenCalledWith("Notes/X.md");
  });

  it("rejects path traversal in mutation tools", async () => {
    await expect(
      planMutation(
        "create_note",
        { path: "../../escape.md", content: "bad" },
        mockBackend,
      ),
    ).rejects.toThrowError(SafetyJailError);
  });
});
