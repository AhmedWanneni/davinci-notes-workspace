// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { computeNoteStats } from "./StatusBar";

describe("computeNoteStats", () => {
  it("computes word count, character count, and property count from note content", () => {
    const content = `---
tags: [test, doc]
author: Leonardo
---
# Hello World

This is a test note with eight words.`;

    const stats = computeNoteStats(content);
    expect(stats.propertyCount).toBe(2);
    // Body is: # Hello World\n\nThis is a test note with eight words.
    expect(stats.wordCount).toBe(10);
    expect(stats.charCount).toBeGreaterThan(0);
  });

  it("handles empty content", () => {
    const stats = computeNoteStats("");
    expect(stats).toEqual({ wordCount: 0, charCount: 0, propertyCount: 0 });
  });
});

describe("StatusBar component rendering", () => {
  it("renders Vim mode indicator when useVimMode is true and vimModeState is set", async () => {
    const { render, screen } = await import("@testing-library/react");
    const { StatusBar } = await import("./StatusBar");
    const { useWorkspaceStore } = await import("../../state/useWorkspaceStore");

    // Default state: OFF
    useWorkspaceStore.setState({ useVimMode: false, vimModeState: null });

    const { rerender } = render(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Sample content"
        graph={null}
      />,
    );

    expect(screen.queryByTestId("status-bar-vim-mode")).toBeNull();

    // Turn setting ON with mode state
    useWorkspaceStore.setState({ useVimMode: true, vimModeState: "NORMAL" });

    rerender(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Sample content"
        graph={null}
      />,
    );

    const badge = screen.getByTestId("status-bar-vim-mode");
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("NORMAL");

    // Transition mode to INSERT
    useWorkspaceStore.setState({ useVimMode: true, vimModeState: "INSERT" });

    rerender(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Sample content"
        graph={null}
      />,
    );

    expect(screen.getByTestId("status-bar-vim-mode").textContent).toBe(
      "INSERT",
    );

    // Turn setting OFF -> indicator completely unmounts
    useWorkspaceStore.setState({ useVimMode: false, vimModeState: null });

    rerender(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Sample content"
        graph={null}
      />,
    );

    expect(screen.queryByTestId("status-bar-vim-mode")).toBeNull();
  });
});
