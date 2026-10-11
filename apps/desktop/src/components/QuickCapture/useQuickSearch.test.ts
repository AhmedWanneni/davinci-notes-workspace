// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SearchResult } from "@app/indexer";
import { useQuickSearch, MAX_SEARCH_RESULTS } from "./useQuickSearch";

describe("useQuickSearch", () => {
  it("returns empty results for empty query without calling searchFn", () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() =>
      useQuickSearch({ searchFn, debounceMs: 10 }),
    );

    expect(result.current.results).toEqual([]);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it("debounces queries and returns results", async () => {
    const mockResults: SearchResult[] = [
      { path: "note1.md", title: "Note 1", mtime: 100, score: -2.5 },
      { path: "folder/note2.md", title: "Note 2", mtime: 200, score: -1.5 },
    ];
    const searchFn = vi.fn().mockResolvedValue(mockResults);
    const { result } = renderHook(() =>
      useQuickSearch({ searchFn, debounceMs: 15 }),
    );

    act(() => {
      result.current.setQuery("test query");
    });

    expect(searchFn).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledWith("test query");
      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0].path).toBe("note1.md");
    });
  });

  it("caps results to MAX_SEARCH_RESULTS (8)", async () => {
    const tenResults: SearchResult[] = Array.from({ length: 12 }, (_, i) => ({
      path: `note${i}.md`,
      title: `Note ${i}`,
      mtime: 100 + i,
      score: -10 + i,
    }));
    const searchFn = vi.fn().mockResolvedValue(tenResults);
    const { result } = renderHook(() =>
      useQuickSearch({ searchFn, debounceMs: 10 }),
    );

    act(() => {
      result.current.setQuery("many notes");
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(MAX_SEARCH_RESULTS);
      expect(result.current.results).toHaveLength(8);
    });
  });

  it("cancels stale queries when a newer query is issued", async () => {
    let resolveFirst: (results: SearchResult[]) => void;
    const firstPromise = new Promise<SearchResult[]>((resolve) => {
      resolveFirst = resolve;
    });

    const secondResults: SearchResult[] = [
      { path: "second.md", title: "Second Note", mtime: 200, score: -5 },
    ];

    const searchFn = vi.fn().mockImplementation((q: string) => {
      if (q === "first") return firstPromise;
      return Promise.resolve(secondResults);
    });

    const { result } = renderHook(() =>
      useQuickSearch({ searchFn, debounceMs: 10 }),
    );

    // Type first query
    act(() => {
      result.current.setQuery("first");
    });

    // Wait for first search call
    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledWith("first");
    });

    // Type second query before first resolves
    act(() => {
      result.current.setQuery("second");
    });

    // Wait for second search call and resolution
    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledWith("second");
      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].path).toBe("second.md");
    });

    // Now resolve first promise with stale data
    act(() => {
      resolveFirst!([
        { path: "stale.md", title: "Stale Note", mtime: 50, score: -10 },
      ]);
    });

    // Second results should still be active; stale results discarded
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].path).toBe("second.md");
  });

  it("cycles selection with selectNext and selectPrevious", async () => {
    const items: SearchResult[] = [
      { path: "a.md", title: "A", mtime: 1, score: 1 },
      { path: "b.md", title: "B", mtime: 2, score: 2 },
      { path: "c.md", title: "C", mtime: 3, score: 3 },
    ];
    const { result } = renderHook(() =>
      useQuickSearch({ searchFn: async () => items, debounceMs: 10 }),
    );

    act(() => {
      result.current.setQuery("abc");
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(3);
    });

    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.selectNext();
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      result.current.selectNext();
    });
    expect(result.current.selectedIndex).toBe(2);

    // Wraps to 0
    act(() => {
      result.current.selectNext();
    });
    expect(result.current.selectedIndex).toBe(0);

    // Wraps backwards to 2
    act(() => {
      result.current.selectPrevious();
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("handles query rejection gracefully without throwing", async () => {
    const searchFn = vi.fn().mockRejectedValue(new Error("SQLITE_BUSY"));
    const { result } = renderHook(() =>
      useQuickSearch({ searchFn, debounceMs: 10 }),
    );

    act(() => {
      result.current.setQuery("failing query");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.results).toEqual([]);
    });
  });
});
