// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  assembleContextAttachments,
  MAX_NOTE_CHARS,
} from "./agentContextAssembler";
import { AgentMentionChip } from "./AgentMentionChip";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { AgentChatInput } from "./AgentChatInput";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { MentionItem } from "./agentTypes";

describe("Phase 5: Rich Context Mentions Pipeline", () => {
  describe("agentContextAssembler", () => {
    it("returns empty string when no mentions are passed", async () => {
      const xml = await assembleContextAttachments([]);
      expect(xml).toBe("");
    });

    it("assembles note attachments within XML envelope", async () => {
      const mentions: MentionItem[] = [
        {
          id: "file:Work/Meeting.md",
          type: "file",
          path: "Work/Meeting.md",
          label: "Meeting.md",
        },
      ];

      const readNoteFn = vi.fn().mockResolvedValue({
        content: "# Meeting Notes\nDiscuss project deadlines.",
      });

      const xml = await assembleContextAttachments(mentions, { readNoteFn });
      expect(xml).toContain("<context_attachments>");
      expect(xml).toContain('<note path="Work/Meeting.md">');
      expect(xml).toContain("Discuss project deadlines.");
      expect(xml).toContain("</note>");
      expect(xml).toContain("</context_attachments>");
    });

    it("truncates note content exceeding 24K tokens (96,000 chars)", async () => {
      const hugeContent = "x".repeat(MAX_NOTE_CHARS + 5000);
      const mentions: MentionItem[] = [
        {
          id: "file:Large.md",
          type: "file",
          path: "Large.md",
          label: "Large.md",
        },
      ];

      const readNoteFn = vi.fn().mockResolvedValue({
        content: hugeContent,
      });

      const xml = await assembleContextAttachments(mentions, { readNoteFn });
      expect(xml).toContain(
        "[... Truncated: note exceeds 24,000 token limit ...]",
      );
      expect(xml.length).toBeLessThan(hugeContent.length);
    });

    it("assembles folder context with directory tree and top notes", async () => {
      const mentions: MentionItem[] = [
        {
          id: "folder:Projects/",
          type: "folder",
          path: "Projects/",
          label: "Projects",
        },
      ];

      const allNotePaths = [
        "Projects/Roadmap.md",
        "Projects/Tasks.md",
        "Personal/Journal.md",
      ];

      const readNoteFn = vi.fn().mockImplementation(async (p: string) => {
        if (p === "Projects/Roadmap.md") {
          return { content: "# Roadmap 2026" };
        }
        if (p === "Projects/Tasks.md") {
          return { content: "- [ ] Launch feature" };
        }
        return null;
      });

      const xml = await assembleContextAttachments(mentions, {
        allNotePaths,
        readNoteFn,
      });

      expect(xml).toContain('<folder path="Projects/">');
      expect(xml).toContain("<directory_tree>");
      expect(xml).toContain("- Roadmap.md");
      expect(xml).toContain("- Tasks.md");
      expect(xml).toContain("</directory_tree>");
      expect(xml).toContain('<file path="Projects/Roadmap.md">');
      expect(xml).toContain("# Roadmap 2026");
    });
  });

  describe("AgentMentionChip", () => {
    it("renders label and handles removal", () => {
      const onRemove = vi.fn();
      const mention: MentionItem = {
        id: "file:Work/Test.md",
        type: "file",
        path: "Work/Test.md",
        label: "Test.md",
      };

      render(<AgentMentionChip mention={mention} onRemove={onRemove} />);
      expect(screen.getByText("Test.md")).toBeTruthy();

      const removeBtn = screen.getByRole("button", { name: "Remove Test.md" });
      fireEvent.click(removeBtn);
      expect(onRemove).toHaveBeenCalledWith("file:Work/Test.md");
    });
  });

  describe("AgentMentionMenu", () => {
    it("displays active note as @current option", () => {
      useWorkspaceStore.setState({
        activeNotePath: "Work/ActiveSprint.md",
        allNotePaths: ["Work/ActiveSprint.md", "Work/Backlog.md"],
        allFolderPaths: ["Work"],
      });

      render(
        <AgentMentionMenu
          isOpen={true}
          query=""
          selectedIndex={0}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByText(/Current: ActiveSprint\.md/)).toBeTruthy();
    });

    it("performs fuzzy search on queries", () => {
      useWorkspaceStore.setState({
        activeNotePath: null,
        allNotePaths: ["Projects/Architecture.md", "Personal/Recipe.md"],
        allFolderPaths: ["Projects", "Personal"],
      });

      render(
        <AgentMentionMenu
          isOpen={true}
          query="arch"
          selectedIndex={0}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByText("Architecture.md")).toBeTruthy();
      expect(screen.queryByText("Recipe.md")).toBeNull();
    });
  });

  describe("AgentChatInput mention flow", () => {
    it("inserts mention chip when selecting from mention menu and passes to onSend", () => {
      useWorkspaceStore.setState({
        activeNotePath: null,
        allNotePaths: ["Notes/Ideas.md"],
        allFolderPaths: ["Notes"],
      });

      const onSend = vi.fn();
      render(
        <AgentChatInput
          onSend={onSend}
          isStreaming={false}
          autoApply={true}
          onToggleAutoApply={vi.fn()}
          currentProvider="gemini"
          currentModel="gemini-2.5-flash"
          onSelectModel={vi.fn()}
          webSearchEnabled={false}
          onToggleWebSearch={vi.fn()}
          onOpenSettings={vi.fn()}
        />,
      );

      const textarea = screen.getByLabelText("Agent prompt input");
      // Trigger mention menu by typing '@'
      fireEvent.change(textarea, { target: { value: "Review @" } });

      // The mention menu should be visible with Ideas.md
      const option = screen.getByText("Ideas.md");
      fireEvent.click(option);

      // A mention chip should appear
      expect(screen.getByText("Ideas.md")).toBeTruthy();

      // Submit prompt
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

      expect(onSend).toHaveBeenCalledWith("Review", undefined, [
        expect.objectContaining({
          id: "file:Notes/Ideas.md",
          path: "Notes/Ideas.md",
        }),
      ]);
    });
  });
});
