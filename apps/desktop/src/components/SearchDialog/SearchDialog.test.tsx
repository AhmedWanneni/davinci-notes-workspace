// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchDialog } from "./SearchDialog";

const props = {
  isOpen: true,
  onOpenChange: vi.fn(),
  onSearch: vi.fn(async () => [{ path: "exact.md", title: "Exact", snippet: "match", mtime: 1, score: 1 }]),
  onSelectNote: vi.fn(),
};

describe("SearchDialog semantic mode", () => {
  it("hides semantic mode when AI is disabled", () => {
    render(<SearchDialog {...props} />);
    expect(screen.queryByRole("button", { name: "Semantic" })).toBeNull();
  });

  it("runs semantic search after opt-in and keeps exact search available", async () => {
    const semanticSearch = vi.fn(async () => [{ path: "concept.md", heading: "Ideas", startLine: 2, endLine: 4, score: 0.9 }]);
    render(<SearchDialog {...props} semanticSearch={semanticSearch} semanticSearchEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Semantic" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "conceptual query" } });
    await waitFor(() => expect(semanticSearch).toHaveBeenCalledWith("conceptual query"));
    expect(screen.getByText("Semantic match - Ideas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Exact" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "exact" } });
    await waitFor(() => expect(props.onSearch).toHaveBeenCalledWith("exact"));
  });

  it("does not embed short semantic queries", async () => {
    const semanticSearch = vi.fn(async () => []);
    render(<SearchDialog {...props} semanticSearch={semanticSearch} semanticSearchEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Semantic" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ab" } });
    await new Promise((resolve) => setTimeout(resolve, 180));
    expect(semanticSearch).not.toHaveBeenCalled();
  });

  it("shows empty search prompt when opened with empty query", () => {
    const openNotes = ["first.md", "second.md", "third.md", "fourth.md", "fifth.md", "sixth.md"];
    render(<SearchDialog {...props} openNotes={openNotes} />);
    expect(screen.queryByText("first")).toBeNull();
    expect(screen.getByText("No files to display. Type to search.")).toBeTruthy();
  });
});
