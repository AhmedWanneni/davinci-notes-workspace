// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";
import { executeRewriteStep } from "@app/ai-agent";
import { validateAgentAction } from "@app/ai-agent";

const mockComplete = vi.fn();
const mockDelete = vi.fn();
const mockWrite = vi.fn();

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
  createConfiguredProvider: vi.fn().mockImplementation(() => ({
    complete: mockComplete,
  })),
}));

vi.mock("../../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      vaultPath: "/test/vault",
      allNotePaths: ["Work/Meeting.md", "Personal/Ideas.md"],
      allFolderPaths: ["Work", "Personal"],
    }),
  },
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: vi.fn().mockResolvedValue("Existing content"),
  }),
  createDesktopMutationBackend: () => ({
    writeNote: (...args: unknown[]) => mockWrite(...args),
    readNote: vi.fn().mockResolvedValue("Existing content"),
    deleteNote: (...args: unknown[]) => mockDelete(...args),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: vi.fn().mockResolvedValue(undefined),
  readNote: vi.fn().mockResolvedValue({ content: "Existing content" }),
}));

describe("Adversarial Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Case 1: 'that note about the thing from last week' (vague target) -> triggers clarifying question, zero actions", async () => {
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Review note about the thing from last week",
        intent: "read_note",
        target: null,
        constraints: ["last week"],
        ambiguities: ["Vague target reference 'the thing'"],
      }),
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("that note about the thing from last week");
    });

    const assistantMsg = result.current.messages.find((m) => m.role === "assistant");
    console.log("CASE 1 OUTPUT:", JSON.stringify(assistantMsg));
    expect(assistantMsg?.content).toContain("Could you specify which note you are referring to?");
    expect(result.current.stagedChanges.length).toBe(0);
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("Case 2: 'delete everything about work' -> hits confirmation gate, not executed on disk", async () => {
    mockComplete
      .mockResolvedValueOnce({
        // Rewrite step
        content: JSON.stringify({
          goal: "Delete work notes",
          intent: "edit_note",
          target: "Work/Projects.md",
          constraints: [],
          ambiguities: [],
        }),
      })
      .mockResolvedValueOnce({
        // Main call proposing delete_note
        content: "Proposing deletion of work notes.",
        toolCalls: [
          {
            id: "call_del_work",
            name: "delete_note",
            arguments: { path: "Work/Projects.md" },
          },
        ],
      })
      .mockResolvedValueOnce({
        // Confirmation notice
        content: "I have staged Work/Projects.md for your confirmation.",
        toolCalls: undefined,
      });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
        autoApply: true, // autoApply is ON
      }),
    );

    await act(async () => {
      await result.current.sendMessage("delete everything about work");
    });

    console.log("CASE 2 STAGED CHANGES:", JSON.stringify(result.current.stagedChanges));
    expect(mockDelete).not.toHaveBeenCalled();
    expect(result.current.stagedChanges.length).toBe(1);
    expect(result.current.stagedChanges[0].toolName).toBe("delete_note");
    expect(result.current.stagedChanges[0].status).toBe("pending");
  });

  it("Case 3: French with typos -> rewrite step produces valid schema output", async () => {
    const rawMessyInput = "cré un not pouur la reunoin de demian avec les action itms";
    const mockModel = vi.fn().mockResolvedValue(
      JSON.stringify({
        goal: "Créer une note pour la réunion de demain avec les actions",
        intent: "create_note",
        target: "reunion_demain.md",
        constraints: ["inclure les actions"],
        ambiguities: [],
      }),
    );

    const rewritten = await executeRewriteStep(rawMessyInput, mockModel);
    console.log("CASE 3 OUTPUT:", JSON.stringify(rewritten));
    expect(rewritten.goal).toBe("Créer une note pour la réunion de demain avec les actions");
    expect(rewritten.intent).toBe("create_note");
    expect(rewritten.target).toBe("reunion_demain.md");
    expect(rewritten.constraints).toEqual(["inclure les actions"]);
    expect(rewritten.ambiguities).toEqual([]);
  });

  it("Case 4: Model returns invalid JSON -> retry then fallback works, nothing crashes", async () => {
    const mockModel = vi
      .fn()
      .mockResolvedValueOnce("Plain conversational response with no json")
      .mockResolvedValueOnce("{ invalid json broken syntax");

    const rewritten = await executeRewriteStep("summarize project", mockModel);
    console.log("CASE 4 OUTPUT:", JSON.stringify(rewritten));
    expect(mockModel).toHaveBeenCalledTimes(2);
    expect(rewritten).toEqual({
      goal: "summarize project",
      intent: "chat",
      target: null,
      constraints: [],
      ambiguities: [],
    });
  });

  it("Case 5: Model returns action not in allowed list -> rejected and logged", () => {
    const actionResult = validateAgentAction("wipe_vault_completely", { target: "all" });
    console.log("CASE 5 OUTPUT:", JSON.stringify(actionResult));
    expect(actionResult.success).toBe(false);
    if (!actionResult.success) {
      expect(actionResult.error).toContain("is not in the allowed actions list");
    }
  });

  it("Case 6: Measure added latency of the rewrite step", async () => {
    const mockModel = vi.fn().mockImplementation(async () => {
      // Simulate realistic network delay (e.g. 45ms)
      await new Promise((r) => setTimeout(r, 45));
      return JSON.stringify({
        goal: "Search for machine learning notes",
        intent: "search_vault",
        target: "machine learning",
        constraints: [],
        ambiguities: [],
      });
    });

    const start = performance.now();
    const res = await executeRewriteStep("search for ml notes", mockModel);
    const elapsed = performance.now() - start;

    console.log(`CASE 6 MEASURED LATENCY: ${elapsed.toFixed(2)}ms, result:`, JSON.stringify(res));
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});

