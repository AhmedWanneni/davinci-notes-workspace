// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentView } from "./AgentView";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentHistoryDrawer } from "./AgentHistoryDrawer";
import { AgentShortcutsBar } from "./AgentShortcutsBar";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes";

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: vi.fn().mockResolvedValue(""),
  }),
  createDesktopMutationBackend: () => ({
    readNote: vi.fn().mockResolvedValue(null),
    writeNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    moveNote: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
  loadAIProviderStatus: vi.fn().mockResolvedValue("ready"),
  createConfiguredProvider: vi.fn().mockResolvedValue({
    complete: vi.fn().mockResolvedValue({
      content: "I have reviewed your vault.",
      toolCalls: [],
    }),
  }),
  saveSelectedProvider: vi.fn().mockResolvedValue(undefined),
  validateAndSaveProviderKey: vi.fn().mockResolvedValue(undefined),
  saveOllamaConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../vault/vaultCommands", () => ({
  readNote: vi.fn().mockRejectedValue(new Error("File not found")),
  writeNote: vi.fn().mockResolvedValue(undefined),
}));

describe("AgentView Components", () => {
  it("renders empty state and shortcuts bar when configured with no messages", async () => {
    await act(async () => {
      render(<AgentView />);
    });
    expect(
      screen.getByText("What would you like to explore or create?"),
    ).toBeTruthy();
    expect(screen.getByText("Shortcuts:")).toBeTruthy();
    expect(screen.getByText("Weekly Review")).toBeTruthy();
    expect(
      screen.getByPlaceholderText(/Ask a question or request changes/i),
    ).toBeTruthy();
  });

  it("triggers shortcut on click", () => {
    const onTrigger = vi.fn();
    render(
      <AgentShortcutsBar
        shortcuts={[
          {
            id: "sc-1",
            title: "Quick Summary",
            prompt: "Summarize this note",
          },
        ]}
        onTriggerShortcut={onTrigger}
      />,
    );

    expect(screen.getByText("Quick Summary")).toBeTruthy();
    fireEvent.click(screen.getByText("Quick Summary"));
    expect(onTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sc-1" }),
    );
  });

  it("renders user and assistant message bubbles with tools", () => {
    const userMsg: ChatMessageItem = {
      id: "1",
      role: "user",
      content: "Summarize project notes",
      timestamp: 1729851000000,
    };
    const assistantMsg: ChatMessageItem = {
      id: "2",
      role: "assistant",
      content: "Here is your summary.",
      toolCalls: [
        {
          id: "call_1",
          name: "read_note",
          arguments: { path: "Notes/Project.md" },
        },
      ],
      timestamp: 1729851005000,
    };

    const { unmount } = render(<AgentMessageBubble message={userMsg} />);
    expect(screen.getByText("Summarize project notes")).toBeTruthy();
    unmount();

    render(<AgentMessageBubble message={assistantMsg} />);
    expect(screen.getByText("Here is your summary.")).toBeTruthy();
    expect(screen.getByText(/Read "Notes\/Project\.md"/)).toBeTruthy();
  });

  it("renders staged diff viewer with accept and reject buttons", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const onAcceptAll = vi.fn();

    const staged: StagedChangeItem[] = [
      {
        id: "staged_1",
        toolName: "create_note",
        status: "pending",
        plan: {
          changeRecord: {
            action: "create",
            path: "Summaries/Q3.md",
            beforeContent: null,
            afterContent: "# Q3 Summary\nKey points",
          },
          diff: [
            { kind: "added", text: "# Q3 Summary" },
            { kind: "added", text: "Key points" },
          ],
        },
      },
    ];

    render(
      <AgentDiffViewer
        stagedItems={staged}
        onAccept={onAccept}
        onReject={onReject}
        onAcceptAll={onAcceptAll}
      />,
    );

    expect(screen.getByText("Proposed Vault Changes (1)")).toBeTruthy();
    expect(screen.getByText("Summaries/Q3.md")).toBeTruthy();

    fireEvent.click(screen.getByText("Accept"));
    expect(onAccept).toHaveBeenCalledWith(staged[0]);

    fireEvent.click(screen.getByText("Accept All Changes"));
    expect(onAcceptAll).toHaveBeenCalled();
  });

  it("renders transaction history drawer with rollback button", () => {
    const onRollback = vi.fn();
    const onClose = vi.fn();

    render(
      <AgentHistoryDrawer
        isOpen={true}
        onClose={onClose}
        transactions={[
          {
            transactionId: "tx_1",
            timestamp: 1729851000000,
            prompt: "Create weekly plan",
            changes: [
              {
                action: "create",
                path: "Weekly.md",
                beforeContent: null,
                afterContent: "Plan",
              },
            ],
          },
        ]}
        onRollback={onRollback}
      />,
    );

    expect(screen.getByText("Agent Change History")).toBeTruthy();
    expect(screen.getByText("Create weekly plan")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Undo Create weekly plan"));
    expect(onRollback).toHaveBeenCalledWith("tx_1");
  });
});
