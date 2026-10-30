// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCapture } from "./QuickCapture";

describe("QuickCapture - Search and Destination", () => {
  it("preserves typed capture text when switching to search and back", () => {
    render(<QuickCapture />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Preserved thought" } });

    const searchTab = screen.getByRole("tab", { name: /search/i });
    fireEvent.click(searchTab);

    expect(
      screen.queryByRole("textbox", { name: /quick capture text/i }),
    ).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /search notes/i }),
    ).toBeDefined();

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

    fireEvent.keyDown(textarea, { key: "k", metaKey: true });
    const searchInput = screen.getByRole("textbox", { name: /search notes/i });

    fireEvent.keyDown(searchInput, { key: "Escape" });

    const restoredTextarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    }) as HTMLTextAreaElement;
    expect(restoredTextarea).toBeDefined();
    expect(restoredTextarea.value).toBe("Important idea");
  });

  it("submits with optional filename and folder when provided", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    const nameInput = screen.getByRole("textbox", { name: /note name/i });
    const folderInput = screen.getByRole("combobox", { name: /note folder/i });

    fireEvent.change(textarea, { target: { value: "Task details" } });
    fireEvent.change(nameInput, { target: { value: "Sprint Task" } });
    fireEvent.change(folderInput, { target: { value: "work/sprints" } });

    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        "Task details",
        "Sprint Task",
        "work/sprints",
      );
    });
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
