// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentMessageBubble } from "./AgentMessageBubble";
import {
  applyAndSyncCliVaultActions,
  ensureParentFolderToolCalls,
  parseVaultActionTags,
} from "./agentCliVaultSync";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { VaultMutationBackend } from "@app/ai-agent";

describe("Complete Vault Instructions & Clickable Folder Links", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      vaultPath: "/Users/test/MyVault",
      allNotePaths: ["Story/Nadine.md", "Story/Plot.md"],
      allFolderPaths: ["Story"],
      revealedFolderPath: null,
      revealFolderNonce: 0,
    });
  });

  it("parses <vault_action> tags and executes complete folder + note instructions on the vault", async () => {
    const createdFolders: string[] = [];
    const writtenNotes: Record<string, string> = {};
    const logs: string[] = [];

    const mutationBackend: VaultMutationBackend = {
      readNote: vi.fn(async (p) => writtenNotes[p] ?? null),
      writeNote: vi.fn(async (p, c) => {
        writtenNotes[p] = c;
      }),
      createFolder: vi.fn(async (p) => {
        createdFolders.push(p);
      }),
      deleteFolder: vi.fn(async () => {}),
      deleteNote: vi.fn(async () => {}),
      moveNote: vi.fn(async () => {}),
    };

    const rawCliOutput = [
      "I have created the `Story` folder and added the character and plot notes.",
      '<vault_action type="create_folder" path="Story" />',
      '<vault_action type="create_note" path="Story/Nadine.md"># Nadine\nNadine is the maid.</vault_action>',
      '<vault_action type="create_note" path="Story/Plot.md"># Plot\nChapter 1 outline.</vault_action>',
    ].join("\n");

    const parsed = parseVaultActionTags(rawCliOutput);
    expect(parsed.calls).toHaveLength(3);
    expect(parsed.cleanedText).toContain("I have created the `Story` folder");
    expect(parsed.cleanedText).not.toContain("<vault_action");

    const synced = await applyAndSyncCliVaultActions({
      output: rawCliOutput,
      promptText: "Create a Story folder with Nadine.md and Plot.md",
      beforeNotes: [],
      beforeFolders: [],
      mutationBackend,
      appendLog: (l) => logs.push(l),
    });

    expect(createdFolders).toContain("Story");
    expect(writtenNotes["Story/Nadine.md"]).toContain("Nadine is the maid.");
    expect(writtenNotes["Story/Plot.md"]).toContain("Chapter 1 outline.");
    expect(logs).toContain('Creating folder "Story" in vault...');
    expect(logs).toContain('✓ Applied create_folder on "Story"');
    expect(synced.toolCalls.some((c) => c.name === "create_folder")).toBe(true);
    expect(synced.toolCalls.filter((c) => c.name === "create_note")).toHaveLength(2);
  });

  it("automatically surfaces parent folder creation when a nested note is created", () => {
    const { toolCalls } = ensureParentFolderToolCalls(
      [
        {
          id: "tc_1",
          name: "create_note",
          arguments: { path: "Novel/Characters/Nadine.md", content: "# Nadine" },
        },
      ],
      [
        {
          toolCallId: "tc_1",
          name: "create_note",
          content: JSON.stringify({ status: "applied", path: "Novel/Characters/Nadine.md" }),
        },
      ],
    );

    expect(toolCalls[0]).toMatchObject({
      name: "create_folder",
      arguments: { path: "Novel/Characters" },
    });
  });

  it("shows the created folder in the message bubble and opens/reveals the folder when clicked", () => {
    const revealEvents: string[] = [];
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<{ folderPath: string }>).detail;
      if (detail?.folderPath) revealEvents.push(detail.folderPath);
    };
    window.addEventListener("davinci:reveal-folder", listener);

    const openNoteSpy = vi.fn();

    render(
      <AgentMessageBubble
        message={{
          id: "msg_1",
          role: "assistant",
          content: "Created folder `Story` and note [[Story/Nadine.md]].",
          toolCalls: [
            {
              id: "tc_folder",
              name: "create_folder",
              arguments: { path: "Story" },
            },
            {
              id: "tc_note",
              name: "create_note",
              arguments: { path: "Story/Nadine.md" },
            },
          ],
          toolResults: [
            {
              toolCallId: "tc_folder",
              name: "create_folder",
              content: JSON.stringify({ status: "applied", path: "Story" }),
            },
            {
              toolCallId: "tc_note",
              name: "create_note",
              content: JSON.stringify({ status: "applied", path: "Story/Nadine.md" }),
            },
          ],
          timestamp: Date.now(),
        }}
        onNavigateNote={openNoteSpy}
        onNavigateFolder={(folder) =>
          useWorkspaceStore.getState().revealFolderInTree(folder)
        }
      />,
    );

    // 1. Folder created badge is shown and clickable
    const folderBtn = screen.getByTitle('Open folder "Story" in vault');
    expect(folderBtn).toBeTruthy();
    fireEvent.click(folderBtn);

    // Verify folder is revealed in workspace store and event dispatched
    expect(useWorkspaceStore.getState().revealedFolderPath).toBe("Story");
    expect(revealEvents).toContain("Story");

    // 2. Clicking the folder also expands the inline folder contents showing Nadine.md and Plot.md
    const nadineInFolder = screen.getByText("Nadine.md");
    expect(nadineInFolder).toBeTruthy();
    fireEvent.click(nadineInFolder);
    expect(openNoteSpy).toHaveBeenCalledWith("Story/Nadine.md");

    // 3. Clicking the inline markdown `Story` code link also opens the folder
    const inlineFolderLink = screen.getByTitle("Open folder: Story");
    fireEvent.click(inlineFolderLink);
    expect(revealEvents.length).toBeGreaterThanOrEqual(2);

    window.removeEventListener("davinci:reveal-folder", listener);
  });
});
