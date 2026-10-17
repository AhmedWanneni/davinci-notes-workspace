// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InsertNotePicker } from "./InsertNotePicker";

vi.mock("../../vault", () => ({
  readNote: vi.fn().mockResolvedValue({ content: "" }),
}));

describe("InsertNotePicker", () => {
  const notePaths = [
    "FolderA/Alpha.md",
    "FolderB/Alpha.md",
    "Notes/Beta.md",
    "Notes/Gamma.md",
  ];

  it("filters notes by title and handles keyboard navigation", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <InsertNotePicker
        onSelect={onSelect}
        onCancel={onCancel}
        notePaths={notePaths}
      />,
    );

    const input = screen.getByPlaceholderText("Search notes to embed...");
    expect(input).not.toBeNull();

    // Filter to Beta
    fireEvent.change(input, { target: { value: "Beta" } });
    expect(screen.getByText("Beta")).not.toBeNull();
    expect(screen.queryByText("Gamma")).toBeNull();

    // Press Enter to choose Beta (no headings)
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith("Beta");
    });
  });

  it("disambiguates duplicate note stems using folder path", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <InsertNotePicker
        onSelect={onSelect}
        onCancel={onCancel}
        notePaths={notePaths}
      />,
    );

    const input = screen.getByPlaceholderText("Search notes to embed...");
    fireEvent.change(input, { target: { value: "FolderA" } });

    // Choose FolderA/Alpha.md which has duplicate stem Alpha
    const noteBtn = screen.getByText("FolderA");
    fireEvent.click(noteBtn);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith("FolderA/Alpha");
    });
  });

  it("presents heading picker step when note has headings", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const readNoteContent = vi.fn().mockResolvedValue("# Main Title\nText\n## Sub Section\nMore text");

    render(
      <InsertNotePicker
        onSelect={onSelect}
        onCancel={onCancel}
        notePaths={["Notes/WithHeadings.md"]}
        readNoteContent={readNoteContent}
      />,
    );

    const input = screen.getByPlaceholderText("Search notes to embed...");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("(Entire note)")).not.toBeNull();
      expect(screen.getByText(/# Main Title/)).not.toBeNull();
      expect(screen.getByText(/# Sub Section/)).not.toBeNull();
    });

    // Click Sub Section heading
    fireEvent.click(screen.getByText(/# Sub Section/));
    expect(onSelect).toHaveBeenCalledWith("WithHeadings", "Sub Section");
  });

  it("cancels on Escape during note selection", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <InsertNotePicker
        onSelect={onSelect}
        onCancel={onCancel}
        notePaths={notePaths}
      />,
    );

    const input = screen.getByPlaceholderText("Search notes to embed...");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });
});
