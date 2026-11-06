import { describe, it, expect, vi } from "vitest";
import { runAgentStepLoop } from "./agentStepLoop";
import type { AgentToolDefinition, AIProvider } from "@app/ai-api";
import type { ExecuteAgentStepContext } from "./executeAgentStepTool";

describe("Agent Vault Operations & Real-time Progress", () => {
  it("executes create_note and logs real-time progress steps", async () => {
    const logs: string[] = [];
    const onStepLog = vi.fn().mockImplementation((entry: string) => {
      logs.push(entry);
    });

    const mockMutationBackend = {
      readNote: vi.fn().mockResolvedValue(null),
      writeNote: vi.fn().mockResolvedValue(undefined),
      createNote: vi.fn().mockResolvedValue(undefined),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      moveNote: vi.fn().mockResolvedValue(undefined),
      createFolder: vi.fn().mockResolvedValue(undefined),
    };

    const handleApplyChange = vi.fn().mockImplementation(async (item) => {
      await mockMutationBackend.writeNote(
        item.plan.changeRecord.path,
        item.plan.changeRecord.afterContent ?? "",
      );
    });

    const dummyProvider: AIProvider = {
      complete: vi
        .fn()
        // Step 1: Tool call to create_note
        .mockResolvedValueOnce({
          content: "",
          toolCalls: [
            {
              id: "call_1",
              name: "create_note",
              arguments: {
                path: "Characters/Nadine.md",
                content: "# Nadine\nRole: Maid",
              },
            },
          ],
        })
        // Step 2: Final response after tool execution
        .mockResolvedValueOnce({
          content: "I have created Characters/Nadine.md in your vault.",
        }),
    };

    const stepContext: ExecuteAgentStepContext = {
      autoApply: true,
      mutationBackend: mockMutationBackend,
      inspectionBackend: {} as never,
      webSearchBackend: { search: vi.fn() },
      allNotePaths: [],
      handleApplyChange,
      setStagedChanges: vi.fn(),
    };

    const assistantMessages: string[] = [];

    await runAgentStepLoop({
      provider: dummyProvider,
      workingHistory: [
        { role: "user", content: "Create a note for Nadine the maid in Characters folder" },
      ],
      activeTools: [] as AgentToolDefinition[],
      stepContext,
      promptText: "Create a note for Nadine the maid in Characters folder",
      onAssistantMessage: (msg) => {
        assistantMessages.push(msg.content);
      },
      onStepLog,
    });

    // 1. Tool must have been applied to vault mutation backend
    expect(handleApplyChange).toHaveBeenCalled();
    expect(mockMutationBackend.writeNote).toHaveBeenCalledWith(
      "Characters/Nadine.md",
      "# Nadine\nRole: Maid",
    );

    // 2. Real-time progress logs must reflect file creation and confirmation
    expect(logs.some((l) => l.includes('Creating note "Characters/Nadine.md"'))).toBe(true);
    expect(logs.some((l) => l.includes('Applied create_note on "Characters/Nadine.md"'))).toBe(true);

    // 3. Final message is delivered to the user
    expect(assistantMessages[0]).toContain("I have created Characters/Nadine.md in your vault.");
  });

  it("auto-applies edit_note without blocking for manual confirmation when autoApply is enabled", async () => {
    const logs: string[] = [];
    const mockMutationBackend = {
      readNote: vi.fn().mockResolvedValue("# Nadine\nOld details"),
      writeNote: vi.fn().mockResolvedValue(undefined),
      createNote: vi.fn().mockResolvedValue(undefined),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      moveNote: vi.fn().mockResolvedValue(undefined),
    };

    const handleApplyChange = vi.fn().mockResolvedValue(undefined);

    const dummyProvider: AIProvider = {
      complete: vi
        .fn()
        .mockResolvedValueOnce({
          content: "",
          toolCalls: [
            {
              id: "call_edit",
              name: "edit_note",
              arguments: {
                path: "Characters/Nadine.md",
                content: "# Nadine\nUpdated details",
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          content: "Updated Nadine note.",
        }),
    };

    const stepContext: ExecuteAgentStepContext = {
      autoApply: true,
      mutationBackend: mockMutationBackend,
      inspectionBackend: {} as never,
      webSearchBackend: { search: vi.fn() },
      allNotePaths: ["Characters/Nadine.md"],
      handleApplyChange,
      setStagedChanges: vi.fn(),
    };

    await runAgentStepLoop({
      provider: dummyProvider,
      workingHistory: [{ role: "user", content: "Update Nadine note" }],
      activeTools: [],
      stepContext,
      promptText: "Update Nadine note",
      onAssistantMessage: vi.fn(),
      onStepLog: (l) => logs.push(l),
    });

    expect(handleApplyChange).toHaveBeenCalled();
    expect(logs.some((l) => l.includes('Updating note "Characters/Nadine.md"'))).toBe(true);
    expect(logs.some((l) => l.includes('Applied edit_note on "Characters/Nadine.md"'))).toBe(true);
  });
});
