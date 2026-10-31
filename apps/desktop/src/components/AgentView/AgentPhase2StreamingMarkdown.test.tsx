// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentMarkdownContent } from "./AgentMarkdownContent";
import { AgentCodeBlock } from "./AgentCodeBlock";
import { AgentReasoningBlock } from "./AgentReasoningBlock";

describe("Phase 2: Streaming Markdown, Code Blocks & Reasoning", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("Requirement 1: renders reasoning block, toggles open/close, shows thinking state", () => {
    const { rerender } = render(
      <AgentReasoningBlock
        content="Reflecting on graph links..."
        isStreaming={true}
      />,
    );

    expect(screen.getByText("Thinking...")).toBeTruthy();
    expect(screen.getByText("Reflecting on graph links...")).toBeTruthy();

    // Stream finishes -> collapses by default or allows toggling
    rerender(
      <AgentReasoningBlock
        content="Reflecting on graph links..."
        isStreaming={false}
      />,
    );

    const button = screen.getByRole("button");
    expect(screen.getByText("Thought process")).toBeTruthy();

    // Toggle open
    fireEvent.click(button);
    expect(screen.getByText("Reflecting on graph links...")).toBeTruthy();
  });

  it("Requirement 2: code block displays language, copies code to clipboard with feedback", async () => {
    render(
      <AgentCodeBlock
        code="const greet = 'hello';"
        language="typescript"
      />,
    );

    expect(screen.getByText("typescript")).toBeTruthy();
    expect(screen.getByText("const greet = 'hello';")).toBeTruthy();

    const copyBtn = screen.getByRole("button", { name: /copy code/i });
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "const greet = 'hello';",
    );
    expect(screen.getByText("Copied")).toBeTruthy();

    // After 2s timeout, resets
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copy")).toBeTruthy();
  });

  it("Requirement 3: renders full markdown with table, list, wikilink, and code in AgentMarkdownContent", () => {
    const onNavigateNote = vi.fn();
    const markdown = [
      "<think>Analyzing vault</think>",
      "### Summary Header",
      "Check [[Projects/Roadmap|Roadmap Note]] for details.",
      "| Task | Status |",
      "|---|---|",
      "| Build UI | Done |",
      "```bash",
      "pnpm dev",
      "```",
    ].join("\n");

    render(
      <AgentMarkdownContent
        content={markdown}
        onNavigateNote={onNavigateNote}
      />,
    );

    expect(screen.getByText("Thought process")).toBeTruthy();
    expect(screen.getByText("Summary Header")).toBeTruthy();
    expect(screen.getByText("Roadmap Note")).toBeTruthy();
    expect(screen.getByText("Build UI")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByText("pnpm dev")).toBeTruthy();

    // Test wikilink click
    fireEvent.click(screen.getByText("Roadmap Note"));
    expect(onNavigateNote).toHaveBeenCalledWith("Projects/Roadmap");
  });
});
