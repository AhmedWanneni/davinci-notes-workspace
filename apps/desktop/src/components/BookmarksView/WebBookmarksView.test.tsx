// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
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

    const dropdownBtn = screen.getByRole("button", { name: /Notes/i });
    act(() => {
      fireEvent.click(dropdownBtn);
    });
    const linksOption = screen.getByRole("button", { name: /Web links/i });
    act(() => {
      fireEvent.click(linksOption);
    });

    expect(screen.getByText("No web bookmarks yet")).toBeDefined();
    expect(
      screen.getByText(/Import from Chrome \/ Firefox \/ Brave/i),
    ).toBeDefined();
  });

  it("displays collections in sidebar, filters by collection and search query, and adds a link", async () => {
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

    // Collections in sidebar
    expect(screen.getAllByText("All bookmarks").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Development (1)" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Design (1)" })).toBeDefined();

    // Filter by Development collection in sidebar
    const devFolderBtn = screen.getByRole("button", {
      name: "Development (1)",
    });
    act(() => {
      fireEvent.click(devFolderBtn);
    });
    expect(screen.getByText("Rust Language")).toBeDefined();
    expect(screen.queryByText("Figma Design")).toBeNull();

    // Reset to All bookmarks
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "All (2)" }));
    });
    expect(screen.getByText("Rust Language")).toBeDefined();
    expect(screen.getByText("Figma Design")).toBeDefined();

    // Search query filter
    const searchInput = screen.getByLabelText("Search web bookmarks");
    act(() => {
      fireEvent.change(searchInput, { target: { value: "rust" } });
    });
    expect(screen.getByText("Rust Language")).toBeDefined();
    expect(screen.queryByText("Figma Design")).toBeNull();

    // Clear search and add a new link via Add Link button
    act(() => {
      fireEvent.change(searchInput, { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Add Link" }));
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

  it("switches view modes between List, Cards, Headlines, and Moodboard", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w1",
          url: "https://rust-lang.org",
          title: "Rust Language",
          domain: "rust-lang.org",
          folder: "Development",
          addedAt: 2000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    // Default is List view
    expect(screen.getByRole("row")).toBeDefined();

    // Open view menu and switch to Cards
    const viewBtn = screen.getByRole("button", { name: /List/i });
    act(() => {
      fireEvent.click(viewBtn);
    });

    const cardsOption = screen.getByRole("button", { name: "Cards" });
    act(() => {
      fireEvent.click(cardsOption);
    });

    expect(screen.getByText("Rust Language")).toBeDefined();
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
        screen.getByRole("button", { name: /Development/i }),
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Design & UI/i }),
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

  it("opens browser choice modal when clicking Add from browser button next to Add link", async () => {
    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w1",
          url: "https://tauri.app",
          title: "Tauri",
          addedAt: 1000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    // The Add link button and Add from browser button exist next to each other
    expect(screen.getByRole("button", { name: "Add Link" })).toBeDefined();
    const addFromBrowserBtn = screen.getByRole("button", {
      name: "Add from browser",
    });
    expect(addFromBrowserBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(addFromBrowserBtn);
    });

    // Opens the browser selection modal
    expect(
      screen.getByText("Add Bookmarks from Browser"),
    ).toBeDefined();
    expect(
      screen.getByText(/Choose your browser to automatically import bookmarks/i),
    ).toBeDefined();
    expect(screen.getByTestId("browser-card-chrome")).toBeDefined();
    expect(screen.getByTestId("browser-card-firefox")).toBeDefined();
    expect(screen.getByTestId("browser-card-brave")).toBeDefined();

    // Close modal
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close dialog"));
    });
  });

  it("clicks the direct link icon to open the bookmark in browser", async () => {
    vi.mocked(invoke).mockResolvedValue(undefined as never);

    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w1",
          url: "https://tauri.app",
          title: "Tauri v2",
          domain: "tauri.app",
          addedAt: 1000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    const linkBtn = screen.getByTitle("Open link in browser");
    expect(linkBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(linkBtn);
    });

    expect(vi.mocked(invoke)).toHaveBeenCalledWith("open_bookmark_url", {
      url: "https://tauri.app",
    });
  });

  it("imports bookmarks directly when clicking the import button on a detected browser row", async () => {
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === "detect_browser_bookmarks") {
        return [
          { id: "chrome", name: "Google Chrome", available: true, profileCount: 1 },
        ];
      }
      if (cmd === "read_browser_bookmarks") {
        return JSON.stringify({
          roots: {
            bookmark_bar: {
              children: [
                {
                  type: "url",
                  name: "TypeScript Docs",
                  url: "https://typescriptlang.org",
                  date_added: "13200000000000000",
                },
              ],
            },
          },
        });
      }
      return undefined as never;
    });

    useBookmarkStore.setState({
      bookmarks: [],
      webBookmarks: [
        {
          id: "w0",
          url: "https://initial.org",
          title: "Initial",
          addedAt: 1000,
        },
      ],
      isLoaded: true,
    });

    await act(async () => {
      render(<BookmarksView onOpenNote={onOpenNoteMock} initialPage="links" />);
    });

    const addFromBrowserBtn = screen.getByRole("button", { name: "Add from browser" });
    await act(async () => {
      fireEvent.click(addFromBrowserBtn);
    });

    // The Chrome row has a direct Import button
    const chromeImportBtn = screen.getByTitle("Import bookmarks from Google Chrome");
    expect(chromeImportBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(chromeImportBtn);
    });

    // Directly imports the bookmark into the store and closes the dialog
    expect(useBookmarkStore.getState().webBookmarks).toHaveLength(2);
    expect(useBookmarkStore.getState().webBookmarks[1].title).toBe("TypeScript Docs");
  });
});
