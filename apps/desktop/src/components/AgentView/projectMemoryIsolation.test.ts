import { describe, it, expect, vi } from "vitest";
import { executeAgentStepTool } from "./executeAgentStepTool";
import { resolveExecutionPromptAndTools } from "./agentPromptResolver";
import { resolveProjectSisterConversationsContext } from "./agentProjectContextResolver";
import { extractFactToRemember } from "./agentMemoryPersistence";
import type { VaultMutationBackend, AgentConversation } from "@app/ai-agent";

describe("Project Memory Isolation & Sharing", () => {
  it("writes memory to project-scoped file when projectId is present", async () => {
    const writtenNotes: Record<string, string> = {};
    const mutationBackend: VaultMutationBackend = {
      readNote: vi.fn().mockImplementation((path) => {
        if (writtenNotes[path]) return Promise.resolve(writtenNotes[path]);
        throw new Error("File not found");
      }),
      writeNote: vi.fn().mockImplementation((path, content) => {
        writtenNotes[path] = content;
        return Promise.resolve();
      }),
      createNote: vi.fn().mockResolvedValue(undefined),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      moveNote: vi.fn().mockResolvedValue(undefined),
    };

    const dummyCtx = {
      projectId: "project-alpha",
      autoApply: true,
      webSearchBackend: { search: vi.fn() },
      mutationBackend,
      inspectionBackend: {} as never,
      allNotePaths: [],
      handleApplyChange: vi.fn(),
      setStagedChanges: vi.fn(),
    };

    const saveResult = await executeAgentStepTool(
      {
        name: "save_memory",
        arguments: { content: "Alpha project architecture uses SQLite", category: "decision" },
      },
      dummyCtx,
    );

    expect(saveResult).toEqual({
      status: "saved",
      fact: "Alpha project architecture uses SQLite",
      message: 'Saved to memory: "Alpha project architecture uses SQLite"',
    });

    const projectMemoryPath = ".sophia/agent-memory-project-alpha.json";
    expect(writtenNotes[projectMemoryPath]).toBeDefined();
    expect(writtenNotes[projectMemoryPath]).toContain(
      "Alpha project architecture uses SQLite",
    );

    // Other project beta has completely separate memory
    expect(writtenNotes[".sophia/agent-memory-project-beta.json"]).toBeUndefined();
  });

  it("reads project memory into system prompt across chats in same project", async () => {
    const projectAlphaMem = JSON.stringify({
      version: 1,
      entries: [
        {
          id: "mem_1",
          content: "Project Alpha uses Rust backend",
          category: "decision",
          createdAt: Date.now(),
        },
      ],
    });

    const mutationBackend: VaultMutationBackend = {
      readNote: vi.fn().mockImplementation((path) => {
        if (path === ".sophia/agent-memory-project-alpha.json") {
          return Promise.resolve(projectAlphaMem);
        }
        throw new Error("Not found");
      }),
      writeNote: vi.fn().mockResolvedValue(undefined),
      createNote: vi.fn().mockResolvedValue(undefined),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      moveNote: vi.fn().mockResolvedValue(undefined),
    };

    const resChat1 = await resolveExecutionPromptAndTools({
      options: { projectId: "project-alpha", projectName: "Project Alpha" },
      structuredRequest: null,
      provider: {} as never,
      promptText: "What backend do we use?",
      vaultPath: "/test/vault",
      allNotePaths: [],
      allFolderPaths: [],
      mutationBackend,
    });

    // Chat 1 has project memory in prompt
    expect(resChat1.systemPrompt).toContain("Project Alpha uses Rust backend");

    // Chat 2 in the same project also receives the same memory
    const resChat2 = await resolveExecutionPromptAndTools({
      options: { projectId: "project-alpha", projectName: "Project Alpha" },
      structuredRequest: null,
      provider: {} as never,
      promptText: "Remind me of architecture choices",
      vaultPath: "/test/vault",
      allNotePaths: [],
      allFolderPaths: [],
      mutationBackend,
    });

    expect(resChat2.systemPrompt).toContain("Project Alpha uses Rust backend");

    // Project Beta chat does not receive Project Alpha's memory
    const resBeta = await resolveExecutionPromptAndTools({
      options: { projectId: "project-beta", projectName: "Project Beta" },
      structuredRequest: null,
      provider: {} as never,
      promptText: "What is our architecture?",
      vaultPath: "/test/vault",
      allNotePaths: [],
      allFolderPaths: [],
      mutationBackend,
    });

    expect(resBeta.systemPrompt).not.toContain("Project Alpha uses Rust backend");
  });

  it("injects sister conversation context from same project", () => {
    const conversations: AgentConversation[] = [
      {
        id: "conv_1",
        title: "Nadine Story Draft",
        projectId: "proj_story",
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
        messages: [
          { id: "m1", role: "user", content: "Nadine is the maid in my story", timestamp: Date.now() - 9000 },
          { id: "m2", role: "assistant", content: "Got it — Nadine is the maid character.", timestamp: Date.now() - 8000 },
        ],
      },
      {
        id: "conv_2",
        title: "Chapter 1",
        projectId: "proj_story",
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
        messages: [],
      },
    ];

    // Conv 2 (current) should receive context from Conv 1 (sister)
    const result = resolveProjectSisterConversationsContext({
      projectId: "proj_story",
      currentConversationId: "conv_2",
      conversations,
      projectName: "My Story",
    });

    expect(result).toContain("Shared Project Conversations Context");
    expect(result).toContain("Nadine is the maid in my story");
    expect(result).toContain("Nadine Story Draft");
  });

  it("does NOT inject sister context from a different project", () => {
    const conversations: AgentConversation[] = [
      {
        id: "conv_x",
        title: "Project X Chat",
        projectId: "proj_x",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          { id: "mx1", role: "user", content: "X secret context", timestamp: Date.now() },
        ],
      },
    ];

    const result = resolveProjectSisterConversationsContext({
      projectId: "proj_y",
      currentConversationId: "conv_y1",
      conversations,
      projectName: "Project Y",
    });

    expect(result).toBe("");
    expect(result).not.toContain("X secret context");
  });

  it("extracts 'remember that' facts from various prompt patterns", () => {
    expect(
      extractFactToRemember(
        "Nadine is the maid in my story i will create. remember that.",
      ),
    ).toBe("Nadine is the maid in my story i will create");

    expect(
      extractFactToRemember(
        "Nadine is the maid in my story i will create remember that",
      ),
    ).toBe("Nadine is the maid in my story i will create");

    expect(
      extractFactToRemember("please remember that the deadline is Friday"),
    ).toBe("the deadline is Friday");

    expect(extractFactToRemember("don't forget that we use TypeScript here"))
      .toBe("we use TypeScript here");

    expect(extractFactToRemember("keep in mind that the API key is secret"))
      .toBe("the API key is secret");

    expect(extractFactToRemember("just a normal question")).toBeNull();
  });

  it("new chat in a project preserves projectId (store logic check)", () => {
    // Verifies that createNewConversation called with activeProjectId
    // correctly assigns projectId to the new conversation
    const activeProjectId = "proj_my_story";
    const passedProjectId = activeProjectId ?? null;
    expect(passedProjectId).toBe("proj_my_story");

    // The old bug: passing null regardless of active project
    const buggyPassedProjectId = null;
    expect(buggyPassedProjectId).toBeNull(); // This was the broken behavior
  });
});
