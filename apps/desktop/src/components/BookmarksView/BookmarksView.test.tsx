// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BookmarksView } from "./BookmarksView";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";
import { useBookmarkUIStore } from "../../bookmarks/useBookmarkUIStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

async function renderNotes(onOpenNote: (p: string, n: boolean) => void) {
  await act(async () => {
    render(<BookmarksView onOpenNote={onOpenNote} />);
  });
}

describe("BookmarksView — Notes page (same layout as web links)", () => {
  const onOpenNoteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
    useBookmarkUIStore.setState({
      pageTab: "notes",
      activeSection: { type: "all" },
    });
    useWorkspaceStore.setState({
      allNotePaths: [],
      notesContent: {},
      tagIndex: null,
    });
  });

  it("renders a friendly empty state when there are no bookmarked notes", async () => {
    useBookmarkStore.setState({ bookmarks: [], isLoaded: true });
    await renderNotes(onOpenNoteMock);

    expect(screen.getByText("No bookmarked notes yet")).toBeDefined();
    expect(screen.getByText(/Bookmark notes from the note header/i)).toBeDefined();
  });

  it("renders note rows with title, folder and preview, without web-only actions", async () => {
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
    await renderNotes(onOpenNoteMock);

    expect(screen.getAllByTestId("web-bookmark-row")).toHaveLength(2);
    expect(screen.getByText("Architecture")).toBeDefined();
    expect(screen.getByText("Journal")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add Link" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add from browser" })).toBeNull();
  });

  it("filters by search and shows the no-match state", async () => {
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
    await renderNotes(onOpenNoteMock);
    const search = screen.getByLabelText("Search bookmarked notes");

    act(() => {
      fireEvent.change(search, { target: { value: "Pasta" } });
    });
    expect(screen.getByText("Pasta")).toBeDefined();
    expect(screen.queryByText("DaVinci")).toBeNull();

    act(() => {
      fireEvent.change(search, { target: { value: "NonExistent" } });
    });
    expect(screen.getByText("No matching notes")).toBeDefined();
  });

  it("organizes notes into folder collections and filters by tags", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Work/Plan.md", addedAt: 3000 },
        { path: "Work/Retro.md", addedAt: 2000 },
        { path: "Home.md", addedAt: 1000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Work/Plan.md", "Work/Retro.md", "Home.md"],
      tagIndex: {
        tagToNotes: new Map(),
        noteToTags: new Map([["Work/Plan.md", new Set(["planning"])]]),
      } as never,
    });
    await renderNotes(onOpenNoteMock);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Work (2)" }));
    });
    expect(screen.getAllByTestId("web-bookmark-row")).toHaveLength(2);
    expect(screen.queryByText("Home")).toBeNull();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^Unsorted/ }));
    });
    expect(screen.getAllByTestId("web-bookmark-row")).toHaveLength(1);
    expect(screen.getByText("Home")).toBeDefined();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "All (3)" }));
    });
    act(() => {
      fireEvent.click(screen.getByText("Without tags"));
    });
    expect(screen.getAllByTestId("web-bookmark-row")).toHaveLength(2);
    expect(screen.queryByText("Plan")).toBeNull();
  });

  it("lists notes missing from the vault under Trash", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Gone/Old.md", addedAt: 1000, missing: true },
        { path: "Here.md", addedAt: 2000 },
      ],
    });
    useWorkspaceStore.setState({ allNotePaths: ["Here.md"] });
    await renderNotes(onOpenNoteMock);

    expect(screen.queryByText("Old")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^Trash/ }));
    });
    expect(screen.getByText("Old")).toBeDefined();
  });

  it("opens the note on row click and does not show edit or link buttons", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Notes/Test.md", addedAt: 1000 }],
    });
    useWorkspaceStore.setState({ allNotePaths: ["Notes/Test.md"] });
    await renderNotes(onOpenNoteMock);

    act(() => {
      fireEvent.click(screen.getByTestId("web-bookmark-row"));
    });
    expect(onOpenNoteMock).toHaveBeenCalledWith("Notes/Test.md", false);

    // Edit and link buttons should be removed for note bookmarks
    expect(screen.queryByTitle(/Open (bookmark )?link in browser/)).toBeNull();
    expect(screen.queryByTitle("Edit bookmark")).toBeNull();
  });

  it("removes the bookmark (not the note) from the trash action", async () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Notes/ToRemove.md", addedAt: 1000 }],
    });
    useWorkspaceStore.setState({ allNotePaths: ["Notes/ToRemove.md"] });
    await renderNotes(onOpenNoteMock);

    act(() => {
      fireEvent.click(screen.getByTitle("Move to trash"));
    });
    expect(useBookmarkStore.getState().bookmarks).toEqual([]);
  });
});
