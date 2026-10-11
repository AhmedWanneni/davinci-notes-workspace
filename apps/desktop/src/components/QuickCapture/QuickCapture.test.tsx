// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCapture } from "./QuickCapture";

describe("QuickCapture", () => {
  it("renders textarea, counter, and keyboard hints", () => {
    render(<QuickCapture />);

    expect(
      screen.getByRole("textbox", { name: /quick capture text/i }),
    ).toBeDefined();
    expect(screen.getByText(/0 \/ 10000/)).toBeDefined();
    expect(screen.getByRole("button", { name: /save note/i })).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /quit quick capture/i }).length,
    ).toBeGreaterThan(0);
  });

  it("submits on Cmd+S and clears input", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "My captured note" } });

    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My captured note");
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("saves on clicking the Save note button", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const saveButton = screen.getByRole("button", { name: /save note/i });
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Saved via button" } });

    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Saved via button");
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("does not submit on Enter without modifier (allows multiline typing)", () => {
    const handleSave = vi.fn();
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Line one" } });

    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(handleSave).not.toHaveBeenCalled();
  });

  it("dismisses on Escape", async () => {
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onDismiss={handleDismiss} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Unsaved text" } });

    fireEvent.keyDown(textarea, { key: "Escape" });

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("Unsaved text");
  });

  it("dismisses on clicking the Quit button", async () => {
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onDismiss={handleDismiss} />);

    const quitButtons = screen.getAllByRole("button", {
      name: /quit quick capture/i,
    });
    expect(quitButtons.length).toBeGreaterThan(0);
    fireEvent.click(quitButtons[0]);

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  it("dismisses silently when save is triggered on empty/whitespace text", async () => {
    const handleSave = vi.fn();
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} onDismiss={handleDismiss} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "   " } });

    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("displays error message when save fails", async () => {
    const handleSave = vi.fn().mockRejectedValue("Vault not found error");
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Failed note" } });
    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Vault not found error")).toBeDefined();
    });
  });

  it("preserves typed capture text when switching to search and back", () => {
    render(<QuickCapture />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Preserved thought" } });

    // Switch to search via header tab
    const searchTab = screen.getByRole("tab", { name: /search/i });
    fireEvent.click(searchTab);

    expect(
      screen.queryByRole("textbox", { name: /quick capture text/i }),
    ).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /search notes/i }),
    ).toBeDefined();

    // Switch back to capture
    const captureTab = screen.getByRole("tab", { name: /capture/i });
    fireEvent.click(captureTab);

    const restoredTextarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    }) as HTMLTextAreaElement;
    expect(restoredTextarea.value).toBe("Preserved thought");
  });

  it("switches back to capture on Escape in search mode without losing text", () => {
    render(<QuickCapture />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Important idea" } });

    // Switch to search via Tab
    fireEvent.keyDown(textarea, { key: "Tab" });
    const searchInput = screen.getByRole("textbox", { name: /search notes/i });

    // Press Escape while in search mode
    fireEvent.keyDown(searchInput, { key: "Escape" });

    const restoredTextarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    }) as HTMLTextAreaElement;
    expect(restoredTextarea).toBeDefined();
    expect(restoredTextarea.value).toBe("Important idea");
  });

  it("opens selected search result on Enter", async () => {
    const handleOpenNote = vi.fn().mockResolvedValue(undefined);
    const mockSearchResults = [
      { path: "work/project.md", title: "Project Note", mtime: 1, score: -2 },
    ];
    render(
      <QuickCapture
        initialMode="search"
        searchFn={async () => mockSearchResults}
        onOpenNote={handleOpenNote}
      />,
    );

    const searchInput = screen.getByRole("textbox", { name: /search notes/i });
    fireEvent.change(searchInput, { target: { value: "proj" } });

    await waitFor(() => {
      expect(screen.getByText("Project Note")).toBeDefined();
    });

    fireEvent.keyDown(searchInput, { key: "Enter" });

    await waitFor(() => {
      expect(handleOpenNote).toHaveBeenCalledWith("work/project.md");
    });
  });
});
