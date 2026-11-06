import { describe, it, expect, vi } from "vitest";
import { resolveExecutionPromptAndTools } from "./agentPromptResolver";
import { executeCliAgentSession } from "./agentCliRunner";
import { normalizeVaultPath } from "./desktopAgentBridge";
import type { VaultMutationBackend } from "@app/ai-agent";

vi.mock("./cliAgentBridge", () => ({
  detectCliAgents: vi.fn().mockResolvedValue([
    { id: "opencode", installed: true, name: "OpenCode" },
    { id: "claude", installed: true, name: "Claude" },
  ]),
}));

describe("Agent Active Vault Anchoring & Capabilities", () => {
  it("normalizes note paths within the opened vault", () => {
    const allNotes = ["Projects/Sophia.md", "Notes/Ideas.md", "Characters/Nadine.md"];

    expect(normalizeVaultPath("Characters/Nadine", allNotes)).toBe("Characters/Nadine.md");
    expect(normalizeVaultPath("/Characters/Nadine.md", allNotes)).toBe("Characters/Nadine.md");
    expect(normalizeVaultPath("./characters/nadine.md", allNotes)).toBe("Characters/Nadine.md");
    expect(normalizeVaultPath("Projects/Sophia.md", allNotes)).toBe("Projects/Sophia.md");
    expect(normalizeVaultPath("NewNote", allNotes)).toBe("NewNote.md");
  });

  it("always gives the agent full vault inspection and mutation tools regardless of intent", async () => {
    const mutationBackend: VaultMutationBackend = {
      readNote: vi.fn().mockResolvedValue(""),
      writeNote: vi.fn().mockResolvedValue(undefined),
      createNote: vi.fn().mockResolvedValue(undefined),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      moveNote: vi.fn().mockResolvedValue(undefined),
    };

    const dummyProvider = {
      complete: vi.fn().mockResolvedValue({ content: "chat" }),
    };

    const res = await resolveExecutionPromptAndTools({
      options: {
        vaultName: "CreativeVault",
        rewriteEnabled: true,
      },
      structuredRequest: null,
      provider: dummyProvider as never,
      promptText: "who is Nadine in my notes?",
      vaultPath: "/Users/ahmed/CreativeVault",
      allNotePaths: ["Characters/Nadine.md", "Outline.md"],
      allFolderPaths: ["Characters"],
      mutationBackend,
    });

    // System prompt must point to the opened vault
    expect(res.systemPrompt).toContain("CreativeVault");
    expect(res.systemPrompt).toContain("/Users/ahmed/CreativeVault");
    expect(res.systemPrompt).toContain("You ALWAYS point to this opened vault workspace");
    expect(res.systemPrompt).toContain("Characters/Nadine.md");

    // All vault tools must remain active (never stripped away)
    const toolNames = res.activeTools.map((t) => t.name);
    expect(toolNames).toContain("read_note");
    expect(toolNames).toContain("search_vault");
    expect(toolNames).toContain("list_vault_tree");
    expect(toolNames).toContain("create_note");
    expect(toolNames).toContain("edit_note");
    expect(toolNames).toContain("append_to_note");
    expect(toolNames).toContain("save_memory");
  });

  it("injects the opened vault directory and inventory into CLI agents", async () => {
    let sentPrompt = "";
    const runCliPrompt = vi.fn().mockImplementation((_id, _name, prompt) => {
      sentPrompt = prompt;
      return Promise.resolve();
    });

    await executeCliAgentSession({
      agentId: "claude",
      promptText: "Summarize my characters and edit Nadine.md to add more details",
      vaultPath: "/Users/ahmed/StoryVault",
      vaultName: "StoryVault",
      allNotePaths: ["Characters/Nadine.md", "Characters/John.md", "Chapter1.md"],
      webSearchBackend: { search: vi.fn() },
      appendLog: vi.fn(),
      appendChunk: vi.fn(),
      runCliPrompt,
      onComplete: vi.fn(),
    });

    expect(sentPrompt).toContain("[Active Vault Workspace]");
    expect(sentPrompt).toContain("Vault Name: StoryVault");
    expect(sentPrompt).toContain("Vault Directory Path: /Users/ahmed/StoryVault");
    expect(sentPrompt).toContain("Characters/Nadine.md");
    expect(sentPrompt).toContain("Characters/John.md");
    expect(sentPrompt).toContain("You ALWAYS point to this opened vault workspace");
    expect(sentPrompt).toContain(
      "write or edit the actual files in this vault directory",
    );
  });
});
