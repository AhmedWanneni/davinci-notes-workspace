// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { BookmarksView } from "./BookmarksView";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe("BookmarksView — Web Links Page", () => {
  const onOpenNoteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBookmarkStore.getState().reset();
  });

  it("switches between Notes and Web Links pages and shows empty state", async () => {
    useBookmarkStore.setState({
      bookmarks: [{ path: "Note.md", addedAt: 1000 }],
      webBookmarks: [],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} />);
    });

    const linksTab = screen.getByRole("tab", { name: /Web Links/i });
    act(() => {
      fireEvent.click(linksTab);
    });

    expect(screen.getByText("No web bookmarks yet")).toBeDefined();
    expect(
      screen.getByText(/Import from Chrome \/ Firefox \/ Brave/i),
    ).toBeDefined();
  });

  it("adds a web link manually, displays categories in the UI, and filters by category & #tag", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w1",
          url: "https://rust-lang.org",
          title: "Rust Language",
          domain: "rust-lang.org",
          folder: "Development",
          tags: ["rust", "systems"],
          addedAt: 2000,
        },
        {
          id: "w2",
          url: "https://figma.com",
          title: "Figma Design",
          domain: "figma.com",
          folder: "Design",
          tags: ["ui"],
          addedAt: 1000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    // Category view is shown by default
    expect(screen.getByTestId("web-bookmarks-category-view")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Category Development" }),
    ).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Category Design" }),
    ).toBeDefined();

    // Filter by folder chip in toolbar
    const devFolderBtn = screen.getByRole("button", {
      name: "Development (1)",
    });
    act(() => {
      fireEvent.click(devFolderBtn);
    });
    expect(screen.getByText("Rust Language")).toBeDefined();
    expect(screen.queryByText("Figma Design")).toBeNull();

    // Reset to All
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "All (2)" }));
    });

    // Click #rust tag chip to filter by tag
    act(() => {
      fireEvent.click(screen.getByText("#rust"));
    });
    expect(screen.getByText("Rust Language")).toBeDefined();
    expect(screen.queryByText("Figma Design")).toBeNull();

    // Clear search and add a new link via Add Link button
    const searchInput = screen.getByLabelText("Search web bookmarks");
    act(() => {
      fireEvent.change(searchInput, { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: /Add Link/i }));
    });

    act(() => {
      fireEvent.change(screen.getByLabelText("Bookmark URL"), {
        target: { value: "https://tauri.app" },
      });
      fireEvent.change(screen.getByLabelText("Bookmark Title"), {
        target: { value: "Tauri v2" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Link" }));
    });

    expect(screen.getByText("Tauri v2")).toBeDefined();
    expect(useBookmarkStore.getState().webBookmarks).toHaveLength(3);
  });

  it("lets the user choose a browser to auto-import bookmarks and organize by category", async () => {
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === "detect_browser_bookmarks") {
        return [
          {
            id: "chrome",
            name: "Google Chrome",
            available: true,
            profileCount: 1,
          },
          { id: "brave", name: "Brave", available: true, profileCount: 1 },
          { id: "firefox", name: "Firefox", available: false, profileCount: 0 },
        ];
      }
      if (cmd === "read_browser_bookmarks") {
        return [
          {
            url: "https://github.com/tauri-apps/tauri",
            title: "Tauri Repo",
            folder: null,
            addedAt: 1700000000000,
          },
          {
            url: "https://figma.com/community",
            title: "Figma Community",
            folder: null,
            addedAt: 1700000001000,
          },
        ];
      }
      return undefined;
    });

    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    act(() => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /Import from Chrome \/ Firefox \/ Brave/i,
        }),
      );
    });

    const chromeCard = await screen.findByTestId("browser-card-chrome");
    await act(async () => {
      fireEvent.click(chromeCard);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Ready to import 2 bookmarks from Google Chrome/i),
      ).toBeDefined();
    });

    const importBtn = screen.getByRole("button", { name: /Import 2 Links/i });
    await act(async () => {
      fireEvent.click(importBtn);
    });

    await waitFor(() => {
      expect(useBookmarkStore.getState().webBookmarks).toHaveLength(2);
      expect(
        screen.getByRole("region", { name: "Category Development" }),
      ).toBeDefined();
      expect(
        screen.getByRole("region", { name: "Category Design & UI" }),
      ).toBeDefined();
    });
  });

  it("organizes web bookmarks with AI / smart categories and supports Undo", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w1",
          url: "https://github.com/tauri-apps/tauri",
          title: "Tauri GitHub",
          domain: "github.com",
          addedAt: 1000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    const organizeBtn = screen.getByRole("button", {
      name: /Organize with AI/i,
    });
    await act(async () => {
      fireEvent.click(organizeBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Organized 1 link/i)).toBeDefined();
    });
    expect(useBookmarkStore.getState().webBookmarks[0].folder).toBe(
      "Development",
    );

    const undoBtn = screen.getByRole("button", {
      name: /Undo AI Organization/i,
    });
    act(() => {
      fireEvent.click(undoBtn);
    });

    expect(useBookmarkStore.getState().webBookmarks[0].folder).toBeUndefined();
  });
});
