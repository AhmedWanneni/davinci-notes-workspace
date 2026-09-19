// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTreeExpandedFolders } from "./useTreeExpandedFolders";

describe("useTreeExpandedFolders", () => {
  it("expands ancestors of active note path", () => {
    const { result, rerender } = renderHook(
      ({ activePath }) =>
        useTreeExpandedFolders({
          activePath,
        }),
      {
        initialProps: { activePath: null as string | null },
      },
    );

    expect(result.current.expandedFolders.size).toBe(0);

    rerender({ activePath: "projects/frontend/App.tsx" });

    expect(result.current.expandedFolders.has("projects")).toBe(true);
    expect(result.current.expandedFolders.has("projects/frontend")).toBe(true);
  });

  it("handles toggleFolder and expandFolder", () => {
    const onSelectedFolderChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeExpandedFolders({
        activePath: null,
        onSelectedFolderChange,
      }),
    );

    act(() => {
      result.current.toggleFolder("notes");
    });

    expect(result.current.expandedFolders.has("notes")).toBe(true);
    expect(onSelectedFolderChange).toHaveBeenCalledWith("notes");

    act(() => {
      result.current.toggleFolder("notes");
    });

    expect(result.current.expandedFolders.has("notes")).toBe(false);
  });

  it("triggers startRename and expands parent when pendingRenameFolder is provided", () => {
    const onStartRename = vi.fn();
    const onPendingRenameHandled = vi.fn();

    renderHook(() =>
      useTreeExpandedFolders({
        activePath: null,
        pendingRenameFolder: "projects/New Folder",
        onStartRename,
        onPendingRenameHandled,
      }),
    );

    expect(onStartRename).toHaveBeenCalledWith("projects/New Folder", "folder");
    expect(onPendingRenameHandled).toHaveBeenCalled();
  });

  it("triggers startRename and expands parent when pendingRenameNote is provided", () => {
    const onStartRename = vi.fn();
    const onPendingRenameNoteHandled = vi.fn();

    renderHook(() =>
      useTreeExpandedFolders({
        activePath: null,
        pendingRenameNote: "projects/Untitled.md",
        onStartRename,
        onPendingRenameNoteHandled,
      }),
    );

    expect(onStartRename).toHaveBeenCalledWith("projects/Untitled.md", "note");
    expect(onPendingRenameNoteHandled).toHaveBeenCalled();
  });
});
