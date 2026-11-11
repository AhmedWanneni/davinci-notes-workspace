// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { WebBookmarkAddBar } from "./WebBookmarkAddBar";
import * as importer from "../../bookmarks/browserBookmarkImporter";

describe("WebBookmarkAddBar", () => {
  const onAddMock = vi.fn();
  const onAddBatchMock = vi.fn();
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits manual bookmark with normalized url and tags", async () => {
    await act(async () => {
      render(
        <WebBookmarkAddBar
          onAdd={onAddMock}
          onAddBatch={onAddBatchMock}
          onCancel={onCancelMock}
        />,
      );
    });

    act(() => {
      fireEvent.change(screen.getByLabelText("Bookmark URL"), {
        target: { value: "github.com" },
      });
      fireEvent.change(screen.getByLabelText("Bookmark Title"), {
        target: { value: "GitHub" },
      });
      fireEvent.change(screen.getByLabelText("Bookmark Folder"), {
        target: { value: "Code" },
      });
      fireEvent.change(screen.getByLabelText("Bookmark Tags"), {
        target: { value: "git, dev" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Link" }));
    });

    expect(onAddMock).toHaveBeenCalledTimes(1);
    expect(onAddMock).toHaveBeenCalledWith({
      url: "https://github.com",
      title: "GitHub",
      folder: "Code",
      tags: ["git", "dev"],
    });
  });

  it("shows error if url is invalid in manual mode", async () => {
    await act(async () => {
      render(
        <WebBookmarkAddBar
          onAdd={onAddMock}
          onAddBatch={onAddBatchMock}
          onCancel={onCancelMock}
        />,
      );
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Save Link" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("Please enter a URL");
    expect(onAddMock).not.toHaveBeenCalled();
  });

  it("switches to browser mode and lists available browsers", async () => {
    await act(async () => {
      render(
        <WebBookmarkAddBar
          onAdd={onAddMock}
          onAddBatch={onAddBatchMock}
          onCancel={onCancelMock}
        />,
      );
    });

    const fromBrowserBtn = screen.getByRole("button", { name: /From browser\.\.\./i });
    act(() => {
      fireEvent.click(fromBrowserBtn);
    });

    expect(screen.getByText("Choose which browser to add bookmarks from:")).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Google Chrome" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Brave" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Firefox" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Arc" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Microsoft Edge" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Select Vivaldi" })).toBeDefined();
  });

  it("loads bookmarks when a browser is selected and allows adding single or all bookmarks", async () => {
    vi.spyOn(importer, "autoImportFromBrowser").mockResolvedValueOnce({
      items: [
        {
          id: "b1",
          url: "https://tauri.app",
          title: "Tauri Framework",
          domain: "tauri.app",
          folder: "Rust",
          addedAt: 1234,
        },
        {
          id: "b2",
          url: "https://vitejs.dev",
          title: "Vite Build Tool",
          domain: "vitejs.dev",
          folder: "Tools",
          addedAt: 1235,
        },
      ],
      folders: ["Rust", "Tools"],
      detectedFormat: "browser-json",
    });

    render(
      <WebBookmarkAddBar
        onAdd={onAddMock}
        onAddBatch={onAddBatchMock}
        onCancel={onCancelMock}
        initialMode="browser"
      />,
    );

    // Choose Google Chrome via chip
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Select Google Chrome" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/2 bookmarks from Google Chrome/i)).toBeDefined();
    });

    expect(screen.getByText("Tauri Framework")).toBeDefined();
    expect(screen.getByText("Vite Build Tool")).toBeDefined();

    // Add single bookmark
    fireEvent.click(screen.getByRole("button", { name: "Add Tauri Framework" }));
    expect(onAddMock).toHaveBeenCalledWith({
      url: "https://tauri.app",
      title: "Tauri Framework",
      domain: "tauri.app",
      folder: "Rust",
      tags: undefined,
    });

    // Add all bookmarks
    fireEvent.click(screen.getByRole("button", { name: "Add all (2)" }));
    expect(onAddBatchMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: "Tauri Framework" }),
        expect.objectContaining({ title: "Vite Build Tool" }),
      ]),
    );
  });

  it("filters bookmarks in browser list and supports editing in manual form", async () => {
    vi.spyOn(importer, "autoImportFromBrowser").mockResolvedValueOnce({
      items: [
        {
          id: "b1",
          url: "https://tauri.app",
          title: "Tauri Framework",
          domain: "tauri.app",
          addedAt: 1234,
        },
        {
          id: "b2",
          url: "https://vitejs.dev",
          title: "Vite Build Tool",
          domain: "vitejs.dev",
          addedAt: 1235,
        },
      ],
      folders: [],
      detectedFormat: "browser-json",
    });

    render(
      <WebBookmarkAddBar
        onAdd={onAddMock}
        onAddBatch={onAddBatchMock}
        onCancel={onCancelMock}
        initialMode="browser"
      />,
    );

    // Choose Brave via dropdown
    const select = screen.getByLabelText("Select browser dropdown");
    await act(async () => {
      fireEvent.change(select, { target: { value: "brave" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/2 bookmarks from Brave/i)).toBeDefined();
    });

    // Filter by query
    const searchInput = screen.getByLabelText("Search Brave bookmarks");
    fireEvent.change(searchInput, { target: { value: "vite" } });

    expect(screen.queryByText("Tauri Framework")).toBeNull();
    expect(screen.getByText("Vite Build Tool")).toBeDefined();

    // Click Edit to fill into manual form
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    // Now in manual form with values populated
    expect(screen.getByDisplayValue("https://vitejs.dev")).toBeDefined();
    expect(screen.getByDisplayValue("Vite Build Tool")).toBeDefined();
  });

  it("displays error when browser has no bookmarks and lets user switch browser", async () => {
    vi.spyOn(importer, "autoImportFromBrowser").mockResolvedValueOnce({
      items: [],
      folders: [],
      detectedFormat: "unknown",
    });

    render(
      <WebBookmarkAddBar
        onAdd={onAddMock}
        onAddBatch={onAddBatchMock}
        onCancel={onCancelMock}
        initialMode="browser"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Select Arc" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("No bookmarks found in Arc");
    });

    // Can still select another browser
    expect(screen.getByRole("button", { name: "Select Google Chrome" })).toBeDefined();
  });
});
