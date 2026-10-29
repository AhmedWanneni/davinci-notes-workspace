// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BookmarksView } from "./BookmarksView";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

describe("BookmarksView", () => {
  const onOpenNoteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
    useWorkspaceStore.setState({
      allNotePaths: [],
      notesContent: {},
    });
  });

  it("renders friendly empty state when there are no bookmarks", async () => {
    useBookmarkStore.setState({ bookmarks: [], isLoaded: true });
    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });

    expect(screen.getByText("No bookmarks yet")).toBeDefined();
    expect(
      screen.getByText(/Bookmark important notes from the note header/i),
    ).toBeDefined();
  });

  it("renders bookmark items with title, folder, and preview", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Work/Architecture.md", addedAt: 1700000000000 },
        { path: "Personal/Journal.md", addedAt: 1700000005000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Work/Architecture.md", "Personal/Journal.md"],
      notesContent: {
        "Work/Architecture.md": "# Title\n\nFirst line preview of architecture.",
      },
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });

    expect(screen.getByText("Architecture")).toBeDefined();
    expect(screen.getByText("Work")).toBeDefined();
    expect(screen.getByText("Journal")).toBeDefined();
    expect(screen.getByText("Personal")).toBeDefined();
    expect(
      screen.getByText("First line preview of architecture."),
    ).toBeDefined();
  });

  it("filters bookmarks and shows no-matching-results state", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Recipes/Pasta.md", addedAt: 1000 },
        { path: "Projects/DaVinci.md", addedAt: 2000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Recipes/Pasta.md", "Projects/DaVinci.md"],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    const searchInput = screen.getByPlaceholderText("Filter bookmarks...");

    act(() => {
      fireEvent.change(searchInput, { target: { value: "Pasta" } });
    });
    expect(screen.getByText("Pasta")).toBeDefined();
    expect(screen.queryByText("DaVinci")).toBeNull();

    act(() => {
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });
    });
    expect(screen.getByText("No matching bookmarks")).toBeDefined();
  });

  it("sorts bookmarks by Name A-Z and recently added", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Zebra.md", addedAt: 5000 },
        { path: "Apple.md", addedAt: 1000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Zebra.md", "Apple.md"],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    const select = screen.getByLabelText("Sort bookmarks");

    // Default: recent (Zebra @ 5000 first, Apple @ 1000 second)
    let rows = screen.getAllByTestId("bookmark-row");
    expect(rows[0].textContent).toContain("Zebra");
    expect(rows[1].textContent).toContain("Apple");

    // Change to alpha
    act(() => {
      fireEvent.change(select, { target: { value: "alpha" } });
    });
    rows = screen.getAllByTestId("bookmark-row");
    expect(rows[0].textContent).toContain("Apple");
    expect(rows[1].textContent).toContain("Zebra");
  });

  it("displays missing state when note is not in allNotePaths or missing: true", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Deleted/Note.md", addedAt: 1000, missing: true }],
    });
    useWorkspaceStore.setState({
      allNotePaths: [],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    expect(screen.getByText("Missing")).toBeDefined();
  });

  it("opens note on click, and in new tab on Cmd-click", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Notes/Test.md", addedAt: 1000 }],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Notes/Test.md"],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    const row = screen.getByTestId("bookmark-row");

    // Normal click
    act(() => {
      fireEvent.click(row);
    });
    expect(onOpenNoteMock).toHaveBeenCalledWith("Notes/Test.md", false);

    // Cmd-click
    act(() => {
      fireEvent.click(row, { metaKey: true });
    });
    expect(onOpenNoteMock).toHaveBeenCalledWith("Notes/Test.md", true);
  });

  it("removes bookmark when remove button is clicked", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Notes/ToRemove.md", addedAt: 1000 }],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Notes/ToRemove.md"],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    const removeBtn = screen.getByTitle("Remove bookmark");
    act(() => {
      fireEvent.click(removeBtn);
    });

    expect(useBookmarkStore.getState().bookmarks).toEqual([]);
  });

  it("supports keyboard navigation (ArrowDown, ArrowUp, Enter, Delete, /)", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Note1.md", addedAt: 2000 },
        { path: "Note2.md", addedAt: 1000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Note1.md", "Note2.md"],
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });
    const rows = screen.getAllByTestId("bookmark-row");
    expect(rows[0].getAttribute("data-selected")).toBe("true");

    // Arrow down
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowDown" });
    });
    expect(rows[1].getAttribute("data-selected")).toBe("true");

    // Enter to open
    act(() => {
      fireEvent.keyDown(window, { key: "Enter" });
    });
    expect(onOpenNoteMock).toHaveBeenCalledWith("Note2.md", false);

    // Delete to remove
    act(() => {
      fireEvent.keyDown(window, { key: "Delete" });
    });
    expect(useBookmarkStore.getState().bookmarks).toEqual([
      { path: "Note1.md", addedAt: 2000 },
    ]);

    // '/' to focus search input
    const searchInput = screen.getByPlaceholderText("Filter bookmarks...");
    expect(document.activeElement).not.toBe(searchInput);
    act(() => {
      fireEvent.keyDown(window, { key: "/" });
    });
    expect(document.activeElement).toBe(searchInput);
  });
});
