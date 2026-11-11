// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentEditedFilesBar, getEditedNotesFromMessage } from "./AgentEditedFilesBar";
import { renderInlineFormatting } from "./agentMarkdownInlineRenderer";
import type { ChatMessageItem } from "./agentTypes";

describe("Agent Edited Files Navigation & Links", () => {
  it("getEditedNotesFromMessage extracts paths from edit_note and append_to_note tool calls", () => {
    const msg: ChatMessageItem = {
      id: "1",
      role: "assistant",
      content: "I have edited the files for you.",
      timestamp: Date.now(),
      toolCalls: [
        {
          id: "tc-1",
          name: "edit_note",
          arguments: { path: "Story/Nadine.md", content: "Updated content" },
        },
        {
          id: "tc-2",
          name: "append_to_note",
          arguments: { path: "Notes/Tasks.md", content: "- New task" },
        },
      ],
    };

    const notes = getEditedNotesFromMessage(msg);
    expect(notes).toEqual(["Story/Nadine.md", "Notes/Tasks.md"]);
  });

  it("getEditedNotesFromMessage falls back to assistant text when tool calls are omitted", () => {
    const msg: ChatMessageItem = {
      id: "2",
      role: "assistant",
      content: "Updated note Story/Nadine.md with new dialogue.",
      timestamp: Date.now(),
    };

    const notes = getEditedNotesFromMessage(msg);
    expect(notes).toEqual(["Story/Nadine.md"]);
  });

  it("renders AgentEditedFilesBar and clicking opens the note via onNavigateNote", () => {
    const onNavigateNote = vi.fn();
    const msg: ChatMessageItem = {
      id: "3",
      role: "assistant",
      content: "Changes applied.",
      timestamp: Date.now(),
      toolCalls: [
        {
          id: "tc-3",
          name: "edit_note",
          arguments: { path: "Characters/Hero.md" },
        },
      ],
    };

    render(
      <AgentEditedFilesBar message={msg} onNavigateNote={onNavigateNote} />,
    );

    const button = screen.getByRole("button", {
      name: /open note "characters\/hero\.md"/i,
    });
    expect(button).toBeTruthy();
    expect(screen.getByText("Characters/Hero.md")).toBeTruthy();

    fireEvent.click(button);
    expect(onNavigateNote).toHaveBeenCalledWith("Characters/Hero.md");
  });

  it("renderInlineFormatting transforms markdown link [label](note.md) into clickable note link", () => {
    const onNavigateNote = vi.fn();
    const elements = renderInlineFormatting(
      "Please review [Nadine](Story/Nadine.md) for details.",
      {
        onNavigateNote,
        allNotePaths: ["Story/Nadine.md"],
      },
    );

    render(<div data-testid="container">{elements}</div>);
    const linkButton = screen.getByRole("button", { name: "Nadine" });
    expect(linkButton).toBeTruthy();

    fireEvent.click(linkButton);
    expect(onNavigateNote).toHaveBeenCalledWith("Story/Nadine.md");
  });

  it("renderInlineFormatting renders external links as anchor elements", () => {
    const elements = renderInlineFormatting(
      "Read docs at [Sophia Website](https://sophianotes.com).",
    );

    render(<div data-testid="container">{elements}</div>);
    const anchor = screen.getByRole("link", { name: "Sophia Website" });
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute("href")).toBe("https://sophianotes.com");
    expect(anchor.getAttribute("target")).toBe("_blank");
  });

  it("AgentMessageBubble displays edited file banner and navigates upon click", () => {
    const onNavigateNote = vi.fn();
    const msg: ChatMessageItem = {
      id: "4",
      role: "assistant",
      content: "I updated [Plot](Story/Plot.md) for chapter 2.",
      timestamp: Date.now(),
      toolCalls: [
        {
          id: "tc-4",
          name: "edit_note",
          arguments: { path: "Story/Plot.md" },
        },
      ],
    };

    render(
      <AgentMessageBubble message={msg} onNavigateNote={onNavigateNote} />,
    );

    expect(screen.getByTestId("agent-edited-files-bar")).toBeTruthy();
    const openButtons = screen.getAllByRole("button", {
      name: /Story\/Plot\.md|Plot/i,
    });
    expect(openButtons.length).toBeGreaterThan(0);

    fireEvent.click(openButtons[0]);
    expect(onNavigateNote).toHaveBeenCalledWith("Story/Plot.md");
  });
});
