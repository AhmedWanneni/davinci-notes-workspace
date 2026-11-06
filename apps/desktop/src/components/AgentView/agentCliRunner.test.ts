import { describe, it, expect, vi } from "vitest";
import { executeCliAgentSession } from "./agentCliRunner";
import type { ChatMessageItem } from "./agentTypes";

vi.mock("./cliAgentBridge", () => ({
  detectCliAgents: vi.fn().mockResolvedValue([
    { id: "opencode", installed: true, name: "OpenCode" },
  ]),
}));

describe("agentCliRunner conversation history and memory", () => {
  it("includes previous conversation turns in CLI prompt", async () => {
    let sentPrompt = "";
    const runCliPrompt = vi.fn().mockImplementation((_id, _name, prompt) => {
      sentPrompt = prompt;
      return Promise.resolve();
    });

    const messages: ChatMessageItem[] = [
      {
        id: "msg_1",
        role: "user",
        content: "Nadine is the maid in my story i will create. remember that.",
        timestamp: 1000,
      },
      {
        id: "msg_2",
        role: "assistant",
        content: "Got it — Nadine is the maid in your story.",
        timestamp: 2000,
      },
      {
        id: "msg_3",
        role: "user",
        content: "who is Nadine",
        timestamp: 3000,
      },
    ];

    await executeCliAgentSession({
      agentId: "opencode",
      promptText: "who is Nadine",
      vaultPath: "/test/vault",
      webSearchBackend: { search: vi.fn() },
      appendLog: vi.fn(),
      appendChunk: vi.fn(),
      runCliPrompt,
      onComplete: vi.fn(),
      nextMessages: messages,
    });

    expect(sentPrompt).toContain("[Conversation History]");
    expect(sentPrompt).toContain("User: Nadine is the maid in my story i will create. remember that.");
    expect(sentPrompt).toContain("Assistant: Got it — Nadine is the maid in your story.");
    expect(sentPrompt).toContain("[Active Vault Workspace]");
    expect(sentPrompt).toContain("Vault Directory Path: /test/vault");
    expect(sentPrompt).toContain("[Current User Request]");
    expect(sentPrompt).toContain("who is Nadine");
  });

  it("extracts and saves memory when prompt asks to remember", async () => {
    const writtenNotes: Record<string, string> = {};
    const mutationBackend = {
      readNote: vi.fn().mockImplementation((path) => {
        if (writtenNotes[path]) return Promise.resolve(writtenNotes[path]);
        throw new Error("not found");
      }),
      writeNote: vi.fn().mockImplementation((path, content) => {
        writtenNotes[path] = content;
        return Promise.resolve();
      }),
      createNote: vi.fn(),
      updateNote: vi.fn(),
      deleteNote: vi.fn(),
      moveNote: vi.fn(),
    };

    let sentPrompt = "";
    const runCliPrompt = vi.fn().mockImplementation((_id, _name, prompt) => {
      sentPrompt = prompt;
      return Promise.resolve();
    });

    await executeCliAgentSession({
      agentId: "opencode",
      promptText: "remember that Nadine is the royal maid in the story.",
      vaultPath: "/test/vault",
      webSearchBackend: { search: vi.fn() },
      appendLog: vi.fn(),
      appendChunk: vi.fn(),
      runCliPrompt,
      onComplete: vi.fn(),
      mutationBackend,
      projectId: "story-project",
    });

    const projectMemory = writtenNotes[".sophia/agent-memory-story-project.json"];
    expect(projectMemory).toBeDefined();
    expect(projectMemory).toContain("Nadine is the royal maid in the story");
    expect(sentPrompt).toContain("Nadine is the royal maid in the story");
  });
});
