// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { computeNoteStats, StatusBar } from "./StatusBar";

afterEach(() => {
  cleanup();
});

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

  it("renders only character and word count for open note, and nothing when no file is open", async () => {
    const { render, screen } = await import("@testing-library/react");
    const { StatusBar } = await import("./StatusBar");

    const { rerender, container } = render(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Hello world"
        graph={null}
      />,
    );

    // Vault name and indicator must not be present
    expect(screen.queryByText("Test Vault")).toBeNull();
    expect(container.querySelector(".status-bar__vault-indicator")).toBeNull();

    // Word and character count are present
    expect(screen.getByText("2 words")).toBeDefined();
    expect(screen.getByText("11 characters")).toBeDefined();

    // Backlink and property counts must not be present
    expect(screen.queryByText(/backlink/i)).toBeNull();
    expect(screen.queryByText(/propert/i)).toBeNull();

    // Update content
    rerender(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath="test.md"
        content="Hello world with more text"
        graph={null}
      />,
    );
    expect(screen.getByText("5 words")).toBeDefined();
    expect(screen.getByText("26 characters")).toBeDefined();

    // When no file is open, nothing is rendered for stats
    rerender(
      <StatusBar
        vaultName="Test Vault"
        activeNotePath={null}
        content=""
        graph={null}
      />,
    );
    expect(container.querySelector(".status-bar__right")).toBeNull();
    expect(screen.queryByText("No file open")).toBeNull();
  });

  it("does not render drive sync indicator in bottom status bar", () => {
    render(
      <StatusBar
        activeNotePath="test.md"
        content="Hello"
        syncMode="drive"
        isDriveSignedIn={true}
        isDriveSyncing={false}
      />,
    );

    expect(screen.queryByTestId("status-bar-sync-indicator")).toBeNull();
  });
});
